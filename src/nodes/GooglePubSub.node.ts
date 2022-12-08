import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { pubSubApiRequest, simplify } from './GenericFunctions';

import { version } from '../version';

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
						name: 'Topics Subscriptions',
						value: 'topicsSubscriptions',
					},
				],
				default: 'topicsSubscriptions',
				description: 'The resource to consume',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				required: true,
				type: 'options',
				options: [
					{
						name: 'List',
						value: 'list',
					},
				],
				default: 'list',
				description: 'The operation to perform',
			},
			{
				displayName: 'Topic',
				name: 'topic',
				required: true,
				displayOptions: {
					show: {
						resource: ['topicsSubscriptions'],
						operation: ['list'],
					},
				},
				type: 'string',
				default: '',
				description: 'Name of the Google Pub/Sub topic to listen to',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				description: '',
				displayOptions: {
					show: {
						resource: ['topicsSubscriptions'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Page Size',
						name: 'pageSize',
						type: 'number',
						default: '',
						description: 'Maximum number of subscription names to return',
					},
					{
						displayName: 'Page Token',
						name: 'pageToken',
						type: 'string',
						default: '',
						description: 'The value returned by the last ListSubscriptionsResponse; ' +
							'indicates that this is a continuation of a prior subscriptions.list call, ' +
							'and that the system should return the next page of data.',
					},
				],
			},
			{
				displayName: 'Simplify Output',
				name: 'simplifyOutput',
				type: 'boolean',
				default: false,
				description: 'Whether to simplify the output data',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let responseData;
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const project = this.getNodeParameter('projectId', 0) as string;
		const simplifyOutput = this.getNodeParameter('simplifyOutput', 0) as string;

		const qs: IDataObject = {};
		const body: IDataObject = {};
		let endpoint = '';
		let method = '';
		let simplifyProperty = '';

		for (let i = 0; i < items.length; i++) {
			try {
				switch (resource) {
					case 'topicsSubscriptions':
						switch (operation) {
							case 'list':
								// ----------------------------------------
								//             topicsSubscriptions: list
								// ----------------------------------------
								// https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.topics.subscriptions/list

								method = 'GET';
								const topic = this.getNodeParameter('topic', i) as string;
								endpoint = `/projects/${project}/topics/${topic}/subscriptions`;
								Object.assign(qs, this.getNodeParameter('additionalFields', i) as number);
								simplifyProperty = 'subscriptions';
								break;

							default: {
								throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for resource "${resource}"!`);
							}
						}

						break;

					default: {
						throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported!`);
					}
				}

				responseData = await pubSubApiRequest.call(
					this,
					method,
					endpoint,
					qs,
					body,
				);

				if (simplifyOutput) {
					responseData = simplify(responseData, simplifyProperty);
				}

				if (responseData.error) {
					throw new NodeOperationError(this.getNode(), responseData.error);
				}

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
