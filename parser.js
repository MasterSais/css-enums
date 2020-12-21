const {
  isInterfaceDeclaration, isPropertySignature, idText, isModuleDeclaration,
  isTypeAliasDeclaration, isTypeReferenceNode, isLiteralTypeNode, isIdentifier, isQualifiedName,
  isParenthesizedTypeNode, isUnionTypeNode, createCompilerHost, factory, SyntaxKind, createPrinter, NewLineKind, ListFormat
} = require('typescript');

const [, , rootScope, typesEntry, output] = process.argv;

const compiler = createCompilerHost({});

const { statements } = compiler.getSourceFile(typesEntry);

const roots = {};

const statementsMap = {};

const typesMap = {};

for (const statement of statements) {
  if (isInterfaceDeclaration(statement)) {
    roots[statement.name.text] = statement;
    statementsMap[statement.name.text] = {};

    for (const member of statement.members) {
      if (isPropertySignature(member)) {
        statementsMap[statement.name.text][member.name.text] = member;
      }
    }
  }

  if (isModuleDeclaration(statement)) {
    for (const member of statement.body.statements) {
      if (isTypeAliasDeclaration(member)) {
        typesMap[`${statement.name.text}.${member.name.text}`] = member;
      }
    }
  }

  if (isTypeAliasDeclaration(statement)) {
    typesMap[statement.name.text] = statement;
  }
}

const scopesToInclude = [];

const includeScope = (scopeName) => {
  scopesToInclude.push(scopeName);

  for (const clause of roots[scopeName].heritageClauses || []) {
    for (const type of clause.types) {
      includeScope(idText(type.expression));
    }
  }
};

includeScope(rootScope);

const extractTypeReference = (typeNode, scope) => (
  isTypeReferenceNode(typeNode) && (
    isIdentifier(typeNode.typeName) && (
      typesMap[idText(typeNode.typeName)] && extractValues(typesMap[idText(typeNode.typeName)], scope) ||
      scope && typesMap[`${scope}.${idText(typeNode.typeName)}`] && extractValues(typesMap[`${scope}.${idText(typeNode.typeName)}`], scope)
    ) ||
    isQualifiedName(typeNode.typeName) && (
      extractValues(typesMap[`${idText(typeNode.typeName.left)}.${idText(typeNode.typeName.right)}`], idText(typeNode.typeName.left))
    )
  )
);

const extractTypeAliasDeclaration = (typeNode, scope) => (
  isTypeAliasDeclaration(typeNode) && (
    isUnionTypeNode(typeNode.type) && typeNode.type.types.map((node) => extractValues(node, scope)) ||
    isTypeReferenceNode(typeNode.type) && extractValues(typeNode.type, scope)
  )
);

const extractLiteralType = (typeNode) => (
  isLiteralTypeNode(typeNode) &&
  typeNode.literal.text
);

const untracked = (typeNode) => (
  isParenthesizedTypeNode(typeNode) && [] ||
  isTypeReferenceNode(typeNode) && isIdentifier(typeNode.typeName) && (/^T[A-Z][a-z]+/).test(idText(typeNode.typeName)) && [] ||
  console.error('Untracked node', typeNode.kind)
);

const extractValues = (typeNode, scope) => (
  extractTypeReference(typeNode, scope) || extractTypeAliasDeclaration(typeNode, scope) || extractLiteralType(typeNode, scope) || untracked(typeNode, scope) || null
);

const firstUpper = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const enums = [];
const enumNamesMap = {};

for (const scope of scopesToInclude) {
  for (const memberName in statementsMap[scope]) {
    const name = firstUpper(memberName);

    if (!enumNamesMap[name]) {
      enums.push({
        name,
        values: [...new Set(extractValues(statementsMap[scope][memberName].type).flat(10))]
      });

      enumNamesMap[name] = true;
    }
  }
}

const modifiers = [
  factory.createModifier(SyntaxKind.ExportKeyword),
  factory.createModifier(SyntaxKind.ConstKeyword)
];

const enumNodes = enums.map(({ name, values }) => (
  factory.createEnumDeclaration(
    null,
    modifiers,
    name,
    values.map(value => (
      factory.createEnumMember(value.split('-').map(firstUpper).join(''), factory.createStringLiteral(value))
    ))
  )
));

const printer = createPrinter({ newLine: NewLineKind.LineFeed });

compiler.writeFile(output, printer.printList(ListFormat.MultiLine | ListFormat.NoTrailingNewLine, enumNodes));