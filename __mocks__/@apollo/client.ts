import * as apollo from '@apollo/client';

module.exports = {
  ...apollo,
  useMutation: jest.fn()
};
