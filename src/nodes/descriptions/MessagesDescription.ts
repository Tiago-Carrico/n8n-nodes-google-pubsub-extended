import {
	INodeProperties,
} from 'n8n-workflow';

export const messagesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [
					'messages',
				],
			},
		},
		options: [
			{
				name: 'Pull',
				value: 'pull',
			},
		],
		default: 'pull',
		description: 'The operation to perform',
	},
];

export const messagesFields: INodeProperties[] = [
	/*-------------------------------------------------------------------------- */
	/*                           	messages:pull		                         */
	/* ------------------------------------------------------------------------- */

	{
		displayName: 'Subscription',
		name: 'subscription',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['pull'],
			},
		},
		type: 'string',
		default: '',
		description: 'Name of the Google Pub/Sub subscription',
	},
	{
		displayName: 'Maximum Messages',
		name: 'maxMessages',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['pull'],
			},
		},
		type: 'number',
		default: 1,
		description: 'Maximum number of messages to pull',
	},
	{
		displayName: 'Allow Excess Messages',
		name: 'allowExcessMessages',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['pull'],
			},
		},
		type: 'boolean',
		default: false,
		description: 'Whether excess messages are allowed',
	},
	{
		displayName: 'Acknowledge Messages',
		name: 'acknowledgeMessages',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['pull'],
			},
		},
		type: 'boolean',
		default: true,
		description: 'Whether to acknowledge the received messages',
	},
	{
		displayName: 'Decode JSON',
		name: 'decodeJSON',
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['pull'],
			},
		},
		type: 'boolean',
		default: false,
		description: 'If your message data is in JSON, enable this option to decode it automatically',
	},
];
