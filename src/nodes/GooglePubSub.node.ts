import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { version } from '../version';
import { GoogleAuth } from 'google-auth-library';
import { PubSub } from '@google-cloud/pubsub';
import { SubscriberClient } from '@google-cloud/pubsub/build/src/v1';

import {
	safeStringifyParse,
	// simplify,
} from './GenericFunctions';
import {
	messagesFields,
	messagesOperations,
	topicSubscriptionsFields,
	topicSubscriptionsOperations
} from './descriptions';

import { google } from '@google-cloud/pubsub/build/protos/protos';
import stringify from 'json-stringify-safe';
import IReceivedMessage = google.pubsub.v1.IReceivedMessage;
import IAcknowledgeRequest = google.pubsub.v1.IAcknowledgeRequest;

export class GooglePubSub implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Pub/Sub',
		name: 'googlePubSub',
		icon: 'file:googlePubSub.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: `Consume Google Pub/Sub API (v.${version})`,
		defaults: {
			name: 'Google Pub/Sub',
			color: '#1A73E8',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googleApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Project ID',
				name: 'projectId',
				required: true,
				type: 'string',
				default: '',
				description: 'Google Cloud project id',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				required: true,
				type: 'options',
				options: [
					{
						name: 'Messages',
						value: 'messages',
					},
					{
						name: 'Topic Subscriptions',
						value: 'topicSubscriptions',
					},
				],
				default: 'messages',
				description: 'The resource to consume',
			},
			...messagesOperations,
			...messagesFields,
			...topicSubscriptionsOperations,
			...topicSubscriptionsFields,
			// {
			// 	displayName: 'Simplify Output',
			// 	name: 'simplifyOutput',
			// 	type: 'boolean',
			// 	default: false,
			// 	description: 'Whether to simplify the output data',
			// },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const responseData: IDataObject = {};
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const projectId = this.getNodeParameter('projectId', 0) as string;
		// const simplifyOutput = this.getNodeParameter('simplifyOutput', 0) as string;

		// let simplifyProperty = '';

		const credentials = await this.getCredentials('googleApi');
		if (!credentials) {
			throw new Error('Credentials are mandatory!');
		}
		const auth = new GoogleAuth({
			credentials: {
				client_email: credentials.email as string,
				private_key: credentials.privateKey as string,
			},
		});

		for (let i = 0; i < items.length; i++) {
			try {
				switch (resource) {
					case 'topicSubscriptions':
						switch (operation) {
							case 'list': {
								// ----------------------------------------
								//             topicSubscriptions: list
								// ----------------------------------------
								// https://github.com/googleapis/nodejs-pubsub/blob/main/samples/listTopicSubscriptions.js

								const pubSubClient = new PubSub({ projectId, auth });
								const topicName = this.getNodeParameter('topic', i) as string;
								const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
								if (Object.keys(additionalFields).length === 0) {
									const [subscriptions] = safeStringifyParse(
										await pubSubClient.topic(topicName).getSubscriptions(),
									);
									responseData.subscriptions = subscriptions.map((subscription: IDataObject) => subscription.name as string);
								} else {
									const [_, __, subscriptions] = JSON.parse(stringify(
										await pubSubClient.topic(topicName).getSubscriptions({
											pageSize: additionalFields.pageSize as number,
											pageToken: additionalFields.pageToken as string,
										}),
									));
									Object.assign(responseData, subscriptions);
								}
								break;
							}

							default: {
								throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"!`);
							}
						}
						break;

					case 'messages':
						switch (operation) {
							case 'pull': {
								// ----------------------------------------
								//             messages: pull
								// ----------------------------------------
								// https://github.com/googleapis/nodejs-pubsub/blob/main/samples/synchronousPullWithLeaseManagement.js

								const subClient = new SubscriberClient({projectId, auth});
								const subscriptionName = this.getNodeParameter('subscription', i) as string;
								const maxMessages = this.getNodeParameter('maxMessages', i) as number;
								const allowExcessMessages = this.getNodeParameter('allowExcessMessages', i) as boolean;
								const acknowledgeMessages = this.getNodeParameter('acknowledgeMessages', i) as boolean;
								const decodeJSON = this.getNodeParameter('decodeJSON', i) as boolean;

								// The low level API client requires a name only.
								const formattedSubscription =
									subscriptionName.indexOf('/') >= 0
										? subscriptionName
										: subClient.subscriptionPath(projectId, subscriptionName);

								const request = {
									subscription: formattedSubscription,
									maxMessages,
									allowExcessMessages,
								};

								const [response] = safeStringifyParse(
									await subClient.pull(request),
								);
								const receivedMessages = response.receivedMessages;

								// Decode the messages if decodeJSON selected
								if (receivedMessages.length > 0 && decodeJSON) {
									(receivedMessages as IReceivedMessage[]).forEach(item => {
										// @ts-ignore
										item.message.data = JSON.parse(Buffer.from(item.message.data).toString('utf-8'));
									});
								}
								Object.assign(responseData, response);

								// Acknoledge messages acknowledgeMessages is selected
								if (acknowledgeMessages && receivedMessages.length > 0) {
									// Acknowledge messages returned
									// tslint:disable-next-line:forin
									(receivedMessages as IReceivedMessage[]).forEach(item => {
										const ackRequest: IAcknowledgeRequest = {
											subscription: formattedSubscription,
											// @ts-ignore
											ackIds: [item.ackId],
										};
										subClient.acknowledge(ackRequest);
									});
								}
								break;
							}

							case 'streamingPull': {
								// ----------------------------------------
								//             messages: streamingPull
								// ----------------------------------------
								// https://cloud.google.com/pubsub/docs/pull#streamingpull_and_high-level_client_library_code_samples

								const projectId = this.getNodeParameter('projectId', i) as string;
								const subscriptionName = this.getNodeParameter('subscription', i) as string;
								const maxMessages = this.getNodeParameter('maxMessages', i) as number;
								const timeout = this.getNodeParameter('timeout', i) as number;
								const acknowledgeMessages = this.getNodeParameter('acknowledgeMessages', i) as boolean;
								const decodeJSON = this.getNodeParameter('decodeJSON', i) as boolean;

								const pubSubClient = new PubSub({projectId, auth});

								// References an existing subscription
								const subscription = pubSubClient.subscription(subscriptionName);

								const receivedMessages: IDataObject[] = [];
								let messageCount = 0;
								await new Promise((resolve) => {
									// Create an event handler to handle messages
									// @ts-ignore
									const messageHandler = message => {
										// The message is a circular object (referencing itself). We take only the properties that are useful to us
										const nonCircularMessage = {
											id: message.id,
											data: message.data,
											attributes: message.attributes,
											ackId: message.ackId,
										};
										if (decodeJSON) {
											nonCircularMessage.data = JSON.parse(Buffer.from(nonCircularMessage.data).toString('utf-8'));
										}
										receivedMessages.push(nonCircularMessage);
										messageCount += 1;

										// Acknoledge message if acknowledgeMessages switch is set to true
										if (acknowledgeMessages) {
											message.ack();
										}

										// Stop the listener and resolve promise when the maxMessages are reached
										if (messageCount === maxMessages) {
											// console.log(`${messageCount} message(s) received. The maxMessages are reached.`);
											subscription.removeListener(`message`, messageHandler);
											resolve(true);
										}
									};

									setTimeout(() => {
										subscription.removeListener('message', messageHandler);
										// console.log(`${messageCount} message(s) received. Timeout reached.`);
										resolve(true);
									}, timeout * 1000);

									// Listen for new messages until timeout is hit
									subscription.on('message', messageHandler);
								});

								responseData.receivedMessages = receivedMessages as IDataObject[];
								responseData.count = messageCount;
								break;
							}

							case 'acknowledge': {
								// ----------------------------------------
								//             messages: acknowledge
								// ----------------------------------------
								// https://github.com/googleapis/nodejs-pubsub/blob/main/samples/synchronousPullWithDeliveryAttempts.js

								const subscriptionName = this.getNodeParameter('subscription', i) as string;
								const jsonAckIds = this.getNodeParameter('jsonAckIds', i) as boolean;

								let ackIds;
								if (jsonAckIds) {
									ackIds = this.getNodeParameter('ackIds', i) as string[];
								} else {
									ackIds = this.getNodeParameter('ackIds', i) as IDataObject;
									ackIds = (ackIds.metadataValues as IDataObject[]).map(a => a.id) as string[];
								}

								// Creates a client; cache this for further use.
								const subClient = new SubscriberClient({projectId, auth});

								// The low level API client requires a name only.
								const formattedSubscription =
									subscriptionName.indexOf('/') >= 0
										? subscriptionName
										: subClient.subscriptionPath(projectId, subscriptionName);

								// Acknowledge all the messages. You could also acknowledge
								// these individually, but this is more efficient.
								const ackRequest: IAcknowledgeRequest = {
									subscription: formattedSubscription,
									ackIds,
								};

								await subClient.acknowledge(ackRequest);

								break;
							}

							default: {
								throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"!`);
							}
						}
						break;

					default: {
						throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported!`);
					}
				}

				// Always return data (part of n8n standards)
				if (responseData.constructor === Object && Object.keys(responseData).length === 0) {
					responseData.success = true;
				}

				// if (simplifyOutput) {
				// 	// @ts-ignore
				// 	responseData = simplify(responseData, simplifyProperty);
				// }

				if (Array.isArray(responseData) && typeof responseData[0] !== 'string') {
					returnData.push.apply(returnData, responseData as IDataObject[]);
				} else if (responseData !== undefined) {
					returnData.push(responseData as IDataObject);
				}
				// tslint:disable-next-line:no-any
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({error: error.message});
					continue;
				}
				throw error;
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
