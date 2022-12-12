import { IDataObject } from 'n8n-workflow';
import stringify from 'json-stringify-safe';

// export function simplify(jsonData: IDataObject, property: string): IDataObject | IDataObject[] {
// 	return jsonData[property] as IDataObject | IDataObject[] || jsonData;
// }

// tslint:disable-next-line:no-any
export function safeStringifyParse(circularObj: {}): any {
	return JSON.parse(stringify(circularObj));
}
