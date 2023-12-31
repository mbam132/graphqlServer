import { createPubSub } from 'graphql-yoga'
import { User } from '@prisma/client'

export enum SubscriptionAction {
  CREATED = 'CREATED',
  SIGNED_UP = 'SIGNED_UP',
  LOGGED_IN = 'LOGGED_IN',
  DELETED = 'DELETED',
}

export interface SubscriptionEvent {
  action: SubscriptionAction
}

export interface UserSubscription extends SubscriptionEvent {
  user: User
}

interface OtherSubscriptionTypesToAdd {
  nothing: 'forTheMoment'
}

export interface SubscriptionEvents
  extends Record<string, [UserSubscription] | [OtherSubscriptionTypesToAdd]> {}

export const pubsub = createPubSub<SubscriptionEvents>({})
