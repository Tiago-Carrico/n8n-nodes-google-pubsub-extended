import {
	INodeProperties,
} from 'n8n-workflow';

export const topicSubscriptionsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'topicSubscriptions',
				],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
			},
		],
		default: 'list',
		description: 'The operation to perform',
	},
];

export const topicSubscriptionsFields: INodeProperties[] = [
	/*-------------------------------------------------------------------------- */
	/*                           topicSubscriptions:list                        */
	/* ------------------------------------------------------------------------- */

	{
		displayName: 'Topic',
		name: 'topic',
		required: true,
		displayOptions: {
			show: {
				resource: ['topicSubscriptions'],
				operation: ['list'],
			},
		},
		type: 'string',
		default: '',
		description: 'Name of the Google Pub/Sub topic',
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
				resource: ['topicSubscriptions'],
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
];
