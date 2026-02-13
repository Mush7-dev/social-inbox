import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocialMessageDocument } from '../../schemas/social-message.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/social-inbox',
})
export class SocialInboxGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocialInboxGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNewMessage(message: SocialMessageDocument) {
    this.server.emit('new_message', {
      message,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasted new message: ${message._id}`);
  }

  sendMessageUpdate(message: SocialMessageDocument) {
    this.server.emit('message_update', {
      message,
      timestamp: new Date(),
    });
  }

  sendConversationUpdate(conversationId: string, unreadCount: number) {
    this.server.emit('conversation_update', {
      conversationId,
      unreadCount,
      timestamp: new Date(),
    });
  }
}
