'use strict';

import fetch from "node-fetch";
// const xml2json = require('xml2json');

type Protocol = 'http' | 'https';
type FFunction = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12'; 

class JmriClient {
  protected readonly _protocol:Protocol;
  protected readonly _host:string;
  protected readonly _path:string;
  protected readonly _port:number = 80;

  constructor(protocol: Protocol, host: string, path: string, port?: number) {
    this._protocol = protocol;
    this._host = host;
    this._path = path;
    if (port !== undefined) this._port = port;

    this._validate();
  }

  protected _validate = () => {
    if(!this._protocol) throw new Error('protocol is empty');
    if(!this._host) throw new Error('host is empty');
    if(!this._path) throw new Error('path is empty');
    if(this._port < 0 || this._port > 65535) throw new Error('port is out of range');
  };

  protected _send = async (xmldata:string) => {
    const body = `<?xml version="1.0" encoding="UTF-8"?><XMLIO>${xmldata}</XMLIO>`;
    const uri = `${this._protocol}://${this._host}/${this._path}`;
    return await fetch(
      uri,
      {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/xml'
        }
      }
    );
    // if (body) body = JSON.parse(xml2json.toJson(body));
  }

  getPower = async () => {
    let xmldata = '';
    return await this._send('<item><type>power</type><name>power</name></item>');
  }

  setPower = async (value:string) => {
    let xmldata = `<item><type>power</type><name>power</name><set>${value}</set></item>`;
    return await this._send(xmldata);
  }

  getThrottle = async (addresses:Array<string>) => {
    let xmldata = '';
    addresses.forEach(function(address){
      xmldata += `<throttle><address>${address}</address></throttle>`;
    });
    return await this._send(xmldata);
  }

  setThrottleSpeed = async (address:string, value:number) => {
    let xmldata = `<throttle><address>${address}</address><speed>${value}</speed></throttle>`;
    return await this._send(xmldata);
  }

  setThrottleFunction = async (address:string, ffunction:FFunction, value:string) => {
    let xmldata = `<throttle><address>${address}</address><${ffunction}>${value}</${ffunction}></throttle>`;
    return await this._send(xmldata);
  }

  setThrottleDirection = async (address:string, value:string) => {
    let xmldata = `<throttle><address>${address}</address><forward>${value}</forward></throttle>`;
    return await this._send(xmldata);
  }

  setTurnout = async (address:string, value:string) => {
    let xmldata = `<turnout name="${address}" set="${value}" />`;
    return await this._send(xmldata);
  }

  getTurnouts = async () => {
    let xmldata = '<list type="turnout" />';
    return await this._send(xmldata);
  }
  
}

export { JmriClient };
