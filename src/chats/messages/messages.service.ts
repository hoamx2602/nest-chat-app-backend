import { Inject, Injectable } from '@nestjs/common';
import { ChatsRepository } from '../chats.repository';
import { Message } from './entities/message.entity';
import { Types } from 'mongoose';
import { CreateMessageInput } from './dto/create-message.input';
import { GetMessagesArgs } from './dto/get-messages.args';
import { PUB_SUB } from 'src/common/constants/injection-tokens';
import { PubSub } from 'graphql-subscriptions';
import { MESSAGE_CREATED } from './constants/pubsub-trigger';
import { MessageCreatedArgs } from './dto/message-created.args';
import { MessageDocument } from './entities/message.document';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  async createMessage({ content, chatId }: CreateMessageInput, userId: string) {
    const messageDocument: MessageDocument = {
      content,
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
      _id: new Types.ObjectId(),
    };
    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        $push: {
          messages: messageDocument,
        },
      },
    );

    const message: Message = {
      ...messageDocument,
      chatId,
      user: await this.usersService.findOne(userId),
    };

    await this.pubsub.publish(MESSAGE_CREATED, {
      messageCreated: message,
    });

    return message;
  }

  async getMessages({ chatId }: GetMessagesArgs) {
    return (
      await this.chatsRepository.findOne({
        _id: chatId,
      })
    ).messages;
  }

  async messageCreated({ chatId }: MessageCreatedArgs) {
    await this.chatsRepository.findOne({
      _id: chatId,
    });

    return this.pubsub.asyncIterator(MESSAGE_CREATED);
  }
}