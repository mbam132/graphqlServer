import { createPubSub } from 'graphql-yoga'
import { User } from '@prisma/client'

export enum SubscriptionAction {
  CREATED = 'CREATED',
  DELETED = 'DELETED',
}

export interface SubscriptionEvent {
  action: SubscriptionAction
}

export interface UserSubscription extends SubscriptionEvent {
  user: User
}

interface OtherSubscriptionTypesToAdd extends SubscriptionEvent {
  nothing: 'forTheMoment'
}

export interface SubscriptionEvents
  extends Record<string, [UserSubscription | OtherSubscriptionTypesToAdd]> {}

export const pubsub = createPubSub<SubscriptionEvents>({})
