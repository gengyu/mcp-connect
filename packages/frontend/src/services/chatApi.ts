import { API_BASE_URL } from './api';
import {TransportAdapter, type TransportRequest, TransportType} from "../transports";
import {type ChatMessage, type DialogState, type Model} from "../../../../share/type.ts";
import log from "loglevel";



export class ChatAPI {

  private transport = new TransportAdapter(TransportType.HTTP, {
    serverUrl: API_BASE_URL,
    prefix: 'chat'
  });



  async sendMessage(message: string, model:Model,  chatId: string): Promise<ChatMessage> {
    const req: TransportRequest = { method: 'sendMessage', payload: { message, model , chatId} };
    this.transport.invokeStream(req);

    // const res = await transport.invokeStream(req);
    // if (!res.success) throw new Error(`发送消息失败: ${res.error}`);
    return  await {
      role: 'assistant',
      content: 'Hello World',
      timestamp: Date.now(),
      type: 'text',
    };
  }

  async sendImage(imageFile: File): Promise<ChatMessage> {
    // 由于TransportAdapter不直接支持FormData，这里仍需特殊处理或扩展TransportAdapter支持文件上传
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await fetch(`${API_BASE_URL}/chat/image`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`发送图片失败: ${response.statusText}`);
    }
    return await response.json();
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const req = { method: 'getChatHistory', payload: {} };
    const res = await this.transport.invokeDirect(req);
    log.info(res);
    if (!res.success) throw new Error(`获取聊天历史失败: ${res.error}`);
    return res.data;
  }

  async saveDialogList(dialog: DialogState) {
    const req = { method: 'saveDialogList', payload: dialog };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`保存对话列表失败: ${res.error}`);
    return res.data;
  }

  async getDialogList(): Promise<DialogState> {
    const req = { method: 'getDialogList', payload: {} };
    const res = await this.transport.invokeDirect(req);
    if (!res.success) throw new Error(`获取对话列表失败: ${res.error}`);
    return res.data;
  }

}

export const chatAPI = new ChatAPI();
