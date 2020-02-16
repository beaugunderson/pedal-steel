module.exports = {
  root: true,

  env: {
    browser: true
  },

  parser: '@typescript-eslint/parser',

  plugins: ['filenames', 'import', 'prettier', 'sort-imports-es6-autofix', '@typescript-eslint'],

  extends: ['airbnb', 'prettier'],

  reportUnusedDisableDirectives: true,

  rules: {
    'array-callback-return': 'off',
    'arrow-body-style': 'off',
    'arrow-parens': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': 'off',
    'consistent-return': 'off',
    curly: ['error', 'all'],
    'filenames/match-exported': 'error',
    'import/default': 'error',
    'import/first': 'off',
    'import/named': 'error',
    'import/newline-after-import': 'warn',
    'import/no-cycle': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-named-as-default-member': 'error',
    'import/no-named-as-default': 'error',
    'import/no-unresolved': 'off',
    'import/order': 'off',
    'import/prefer-default-export': 'off',
    'lines-between-class-members': 'off',
    'no-case-declarations': 'off',
    'no-cond-assign': ['error', 'except-parens'],
    'no-param-reassign': [
      'error',
      {
        props: true,
        // allow reassigning evt.target.value
        ignorePropertyModificationsFor: ['evt']
      }
    ],
    'import/extensions': 'off',
    'no-plusplus': 'off',
    'no-return-assign': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'off',
    'no-useless-constructor': 'off',
    'prettier/prettier': ['error', { singleQuote: true, printWidth: 99 }],

    // override this from airbnb's guide specifically to allow for..of loops
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand'
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
      }
    ],

    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',

    'padding-line-between-statements': [
      'error',
      // separate cases by a blank line
      { blankLine: 'always', prev: 'case', next: 'case' },
      { blankLine: 'always', prev: 'case', next: 'default' }
    ],

    // preferable to built in 'sort-imports' because it handles default imports better and has better auto-fix
    'sort-imports-es6-autofix/sort-imports-es6': [
      'error',
      { ignoreCase: true, memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'] }
    ]
  }
};
