import {
	ICredentialDataDecryptedObject,
	ICredentialTestFunctions,
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	NodeApiError
} from 'n8n-workflow';

import { OptionsWithUri } from 'request-promise-native';
import moment from 'moment';
import * as jwt from 'jsonwebtoken';

export async function pubSubApiRequest(this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
		method: string, endpoint: string, qs: IDataObject = {}, body: IDataObject = {}, uri?: string): Promise<any> { // tslint:disable-line:no-any

	const credentials = await this.getCredentials('googleApi');
	if (!credentials) {
		throw new Error('Credentials are mandatory!');
	}

	const options: OptionsWithUri = {
		method,
		headers: {
			'Accept': 'application/json',
		},
		qs,
		body,
		uri: uri || 'https://pubsub.googleapis.com/v1' + endpoint,
		json: true,
	};

	if (Object.keys(options.qs).length === 0) {
		delete options.qs;
	}
	if (Object.keys(options.body).length === 0) {
		delete options.body;
	}

	let responseData: IDataObject | undefined;
	try {
		const { access_token } = await getAccessToken.call(this, credentials as ICredentialDataDecryptedObject);
		options.headers!.Authorization = `Bearer ${access_token}`;

		responseData = await this.helpers.request!(options);

	} catch (error) {
		if (error.code === 'ERR_OSSL_PEM_NO_START_LINE') {
			error.statusCode = '401';
		}
		throw new NodeApiError(this.getNode(), error);
	}

	if (Object.keys(responseData as IDataObject).length !== 0) {
		return responseData;
	}
	else {
		return { 'success': true };
	}
}

export function getAccessToken(this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions | ICredentialTestFunctions, credentials: ICredentialDataDecryptedObject): Promise<IDataObject> {
	//https://developers.google.com/identity/protocols/oauth2/service-account#httprest

	const scopes = [
		'https://www.googleapis.com/auth/pubsub',
	];

	const now = moment().unix();

	const signature = jwt.sign(
		{
			'iss': credentials.email as string,
			'sub': credentials.delegatedEmail || credentials.email as string,
			'scope': scopes.join(' '),
			'aud': `https://oauth2.googleapis.com/token`,
			'iat': now,
			'exp': now + 3600,
		},
		credentials.privateKey as string,
		{
			algorithm: 'RS256',
			header: {
				'kid': credentials.privateKey as string,
				'typ': 'JWT',
				'alg': 'RS256',
			},
		},
	);

	const options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		method: 'POST',
		form: {
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: signature,
		},
		uri: 'https://oauth2.googleapis.com/token',
		json: true,
	};

	//@ts-ignore
	return this.helpers.request(options);
}

export function simplify(jsonData: IDataObject, property: string): IDataObject | IDataObject[] {
	return jsonData[property] as IDataObject | IDataObject[] || jsonData;
}
