import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
    // 1. Глобальное игнорирование (аналог .eslintignore)
    {
        ignores: ['dist/**/*', 'node_modules/**/*', 'coverage/**/*'],
    },

    // 2. Основная конфигурация для исходного кода
    {
        files: ['src/**/*.js'],
        plugins: {
            jsdoc: jsdoc,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            // Базовые правила ESLint
            'no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    argsIgnorePattern: '^_',
                },
            ],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            curly: ['error', 'all'],
            'no-var': 'error',
            'prefer-const': 'error',

            // Правила для JSDoc (важно для проверки типов)
            'jsdoc/check-alignment': 'warn',
            'jsdoc/check-param-names': 'warn',
            'jsdoc/check-tag-names': 'warn',
            'jsdoc/check-types': 'warn',
            'jsdoc/implements-on-classes': 'warn',
            'jsdoc/require-param': 'warn',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-param-name': 'warn',
            'jsdoc/require-param-type': 'warn',
            'jsdoc/require-returns': 'warn',
            'jsdoc/require-returns-check': 'warn',
            'jsdoc/require-returns-type': 'warn',
        },
    },

    // 3. Конфигурация для тестов (AVA)
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': 'off',
        },
    },

    // 4. Конфигурация для скриптов сборки
    {
        files: ['scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'off',
        },
    },
];
