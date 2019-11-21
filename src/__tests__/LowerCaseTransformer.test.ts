import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { GraphQLTransform } from 'graphql-transformer-core';
import LowercaseTransformer from '../LowercaseTransformer';

test('Test LowercaseTransformer happy case', () => {
  const validSchema = `
    type Post @model {
        id: ID!
        title: String! @lowercase
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new LowercaseTransformer()]
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
});

test('Test LowercaseTransformer on bad field type', () => {
  const invalidSchema = `
  type Post @model {
      id: ID!
      title: String!
      relatedPosts: [Post] @lowercase
      createdAt: String
      updatedAt: String
  }
  `;
  try {
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new LowercaseTransformer()]
    });
    const out = transformer.transform(invalidSchema);
  } catch (e) {
    expect(e.name).toEqual('InvalidDirectiveError');
  }
});

test('Test LowercaseTransformer on parent without @model', () => {
  const invalidSchema = `
  type Post  {
      id: ID!
      title: String! @lowercase
      relatedPosts: [Post]
      createdAt: String
      updatedAt: String
  }
  `;
  try {
    const transformer = new GraphQLTransform({
      transformers: [new DynamoDBModelTransformer(), new LowercaseTransformer()]
    });
    const out = transformer.transform(invalidSchema);
  } catch (e) {
    expect(e.name).toEqual('InvalidDirectiveError');
  }
});
