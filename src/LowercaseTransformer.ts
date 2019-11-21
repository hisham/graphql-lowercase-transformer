import {
  DirectiveNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  NamedTypeNode,
  ObjectTypeDefinitionNode
} from 'graphql';
import { iff, printBlock, qref, raw } from 'graphql-mapping-template';
import { ResolverResourceIDs } from 'graphql-transformer-common';
import {
  gql,
  InvalidDirectiveError,
  Transformer,
  TransformerContext
} from 'graphql-transformer-core';

export default class LowercaseTransformer extends Transformer {
  constructor() {
    super(
      'LowercaseTransformer',
      gql`
        directive @lowercase on FIELD_DEFINITION
      `
    );
  }

  public field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    ctx: TransformerContext
  ): void => {
    const typeName: string = parent.name.value;
    const fieldName: string = definition.name.value;

    this.assertModelDirective(parent.directives);
    this.assertStringType(definition);

    const snippet: string = this.createVTLSnippet(fieldName);
    this.augmentMutations(ctx, typeName, snippet);
  };

  private assertModelDirective = (directives: readonly DirectiveNode[]): void => {
    const modelDirective = directives.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new InvalidDirectiveError(
        'Fields annotated with @lowercase must have parent types annotated with @model.'
      );
    }
  };

  private assertStringType = (definition: FieldDefinitionNode): void => {
    const isStringType: boolean =
      definition.type.kind === 'NonNullType' &&
      (definition.type.type as NamedTypeNode).name.value === 'String';
    if (!isStringType) {
      throw new InvalidDirectiveError('Fields annotated with @lowercase must be of type String.');
    }
  };

  private createVTLSnippet = (fieldName: string): string => {
    return printBlock(`Setting "${fieldName}" to lowercase`)(
      iff(
        raw(`$ctx.args.input.${fieldName}`),
        qref(`$ctx.args.input.put("${fieldName}", $ctx.args.input.${fieldName}.toLowerCase() )`),
        true
      )
    );
  };

  private augmentMutations = (ctx: TransformerContext, typeName: string, snippet: string): void => {
    const createMutationResolverLogicalId: string = ResolverResourceIDs.DynamoDBCreateResolverResourceID(
      typeName
    );
    const updateMutationResolverLogicalId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(
      typeName
    );
    this.augmentResolver(ctx, createMutationResolverLogicalId, snippet);
    this.augmentResolver(ctx, updateMutationResolverLogicalId, snippet);
  };

  private augmentResolver = (
    ctx: TransformerContext,
    resolverLogicalId: string,
    snippet: string
  ): void => {
    const resolver = ctx.getResource(resolverLogicalId);
    if (resolver) {
      resolver.Properties.RequestMappingTemplate =
        snippet + '\n\n' + resolver.Properties.RequestMappingTemplate;
      ctx.setResource(resolverLogicalId, resolver);
    }
  };
}
