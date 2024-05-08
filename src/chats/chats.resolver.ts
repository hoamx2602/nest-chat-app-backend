import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ChatsService } from './chats.service';
import { Chat } from './entities/chat.entity';
import { CreateChatInput } from './dto/create-chat.input';
import { UpdateChatInput } from './dto/update-chat.input';
import { GqlAuthGuard } from 'src/auth/guards';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators';
import { TokenPayload } from 'src/auth/token-payload.interface';

@Resolver(() => Chat)
export class ChatsResolver {
  constructor(private readonly chatsService: ChatsService) {}

  @Mutation(() => Chat)
  @UseGuards(GqlAuthGuard)
  async createChat(
    @Args('createChatInput') createChatInput: CreateChatInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<Chat> {
    return this.chatsService.create(createChatInput, user._id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Chat], { name: 'chats' })
  async findAll(): Promise<Chat[]> {
    return this.chatsService.findMany();
  }

  @Query(() => Chat, { name: 'chat' })
  async findOne(@Args('_id') _id: string): Promise<Chat> {
    return this.chatsService.findOne(_id);
  }

  @Mutation(() => Chat)
  async updateChat(@Args('updateChatInput') updateChatInput: UpdateChatInput) {
    return this.chatsService.update(updateChatInput.id, updateChatInput);
  }

  @Mutation(() => Chat)
  async removeChat(@Args('id', { type: () => Int }) id: number) {
    return this.chatsService.remove(id);
  }
}
