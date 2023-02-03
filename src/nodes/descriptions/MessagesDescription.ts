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
				name: 'Acknowledge',
				value: 'acknowledge',
			},
			{
				name: 'Pull',
				value: 'pull',
			},
			{
				name: 'Streaming Pull',
				value: 'streamingPull',
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

	/*-------------------------------------------------------------------------- */
	/*                           messages:streamingPull		                     */
	/* ------------------------------------------------------------------------- */

	{
		displayName: 'Subscription',
		name: 'subscription',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['streamingPull'],
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
				operation: ['streamingPull'],
			},
		},
		type: 'number',
		default: 100,
		description: 'Maximum number of messages to pull',
	},
	{
		displayName: 'Timeout',
		name: 'timeout',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['streamingPull'],
			},
		},
		type: 'number',
		default: 60,
		description: 'Timeout (in seconds) after which pulling is stopped and messages are returned.',
	},
	{
		displayName: 'Acknowledge Messages',
		name: 'acknowledgeMessages',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['streamingPull'],
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
				operation: ['streamingPull'],
			},
		},
		type: 'boolean',
		default: false,
		description: 'If your message data is in JSON, enable this option to decode it automatically',
	},

	/*-------------------------------------------------------------------------- */
	/*                           messages:acknowledge		                     */
	/* ------------------------------------------------------------------------- */
	{
		displayName: 'Acknowledging a message whose ack deadline has expired may succeed, but such a message may be redelivered later. ' +
			'Acknowledging a message more than once will not result in an error.',
		name: 'jsonNotice',
		type: 'notice',
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['acknowledge'],
			},
		},
		default: '',
	},
	{
		displayName: 'Subscription',
		name: 'subscription',
		required: true,
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['acknowledge'],
			},
		},
		type: 'string',
		default: '',
		description: 'Name of the Google Pub/Sub subscription',
	},
	{
		displayName: 'Acknowledge IDs',
		name: 'ackIds',
		required: true,
		type: 'fixedCollection',
		default: '',
		description: 'List with the acknowledge IDs to add',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['acknowledge'],
				jsonAckIds: [false],
			},
		},
		options: [
			{
				name: 'metadataValues',
				displayName: 'Metadata',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Acknowledge IDs',
		name: 'ackIds',
		required: true,
		type: 'json',
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['acknowledge'],
				jsonAckIds: [true],
			},
		},
		default: '',
		description: 'Array with the acknowledge IDs to add',
	},
	{
		displayName: 'JSON Acknowledge IDs ',
		name: 'jsonAckIds',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['messages'],
				operation: ['acknowledge'],
			},
		},
		default: false,
		description: 'Whether to add the ackIds by JSON or UI ',
	},

];
