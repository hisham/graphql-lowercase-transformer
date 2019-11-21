# graphql-lowercase-transformer
@lowercase graphql transformer to be used in graphql schemas managed by aws amplify cli. Converts strings that have this directive to lowercase before saving to dynamodb. DynamoDB does not support case insensitive string search, so this transformer forces searchable strings to be in lowercase in the backend 
