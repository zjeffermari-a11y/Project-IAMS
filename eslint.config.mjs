import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  ...(Array.isArray(firebaseRulesPlugin.configs['flat/recommended']) ? firebaseRulesPlugin.configs['flat/recommended'] : [firebaseRulesPlugin.configs['flat/recommended']])
];
