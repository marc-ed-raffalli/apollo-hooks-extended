import {ApolloError} from '@apollo/client';

export interface IRequestState<TData> {
  data?: TData;
  loading: boolean;
  error?: ApolloError;
}
