import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserLite } from './user/dto';
import { UserService } from './user/user.service';
import { UserStatus } from '@prisma/client';
import { SocketService } from './sockets/socket.service';
import { ENS } from './sockets/dto';

@WebSocketGateway({ cors: '*:*' })
export class LobbyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private userService: UserService,
    private socketService: SocketService,
  ) {}

  @WebSocketServer() wss: Server;
  private logger: Logger = new Logger('LobbyGateway');

  ///////////////////////////////////////////
  //      INIT, CONNECTION, DISCONNECT     //
  ///////////////////////////////////////////

  afterInit(server: Server) {
    this.logger.log('LobbyGateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.auth.token;
    const user: UserLite = this.socketService.verifyTokenAndGetUser(token);

    if (!user) {
      client.disconnect();
      return;
    }

    // A VOIR COMMENT ON GERE LES DOUBLE CONNECTION ( DEMANDER A FCATINAU )
    if (this.socketService.isConnected(user.id, ENS.LOBBY)) {
      this.logger.error(`USER ${user.login} ALREADY LOGGED IN LobbyGateway`);
      client.disconnect();
      return;
    } else {
      this.logger.log(`USER ${user.login} [${user.id}] CONNECTED`);
      this.socketService.addClient(user, ENS.LOBBY, client);
      this.userService.updateUserStatus(user.id, UserStatus.ONLINE);
      this.wss.emit('loginToClient', user.id);
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.socketService.getUser(client.id) || undefined;
    if (user != undefined) {
      this.socketService.removeClient(user, ENS.LOBBY);
      this.logger.log(`USER ${user.login} [${user.id}] DISCONNECTED`);
      this.userService.updateUserStatus(user.id, UserStatus.OFFLINE);
      this.wss.emit('logoutToClient', user.id);
    } else {
      this.logger.error(`USER UNDEFINED`);
    }
  }

  ///////////////////
  //     EVENTS    //
  ///////////////////

  @SubscribeMessage('userStatus')
  handleStatus(
    @MessageBody() newStatus: UserStatus,
    @ConnectedSocket() client: Socket,
  ) {
    const userId: number = this.socketService.getUser(client.id).id;
    this.userService.updateUserStatus(userId, newStatus);
    this.wss.emit('updateStatus', { id: userId, status: newStatus });
  }

  // Gestion de la QUEUE || BOUNCING VERS LE FRONT POUR ARRIVER DANS LES EVENEMENTS GAMES.
}
