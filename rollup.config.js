// Rollup plugins
import { babel } from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import pkg from './package.json';

export default {
    input: './index.ts',
    output: [
        { file: pkg.main, format: 'cjs' },
    ],
    plugins: [
        nodeResolve(),
        typescript({ module: 'CommonJS' }),
        commonjs({
            extensions: ['.ts'], 
            sourcemap: true,
        }),
        eslint(),
        babel({
            exclude: 'node_modules/**',
        }),
        (process.env.NODE_ENV === 'production' && uglify()),
    ],
};