// Libraries
var path = require('path');
var express = require('express');

// Webpack plugins
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var LiveReloadPlugin = require('webpack-livereload-plugin');

// Constants used, can edit
const entryNames = ['index'];
const namespace = 'SCEPTRED';
const version = require('./package.json').version;

module.exports = function(env, caller) {

    const isProduction = !!caller && 'p' in caller && caller.p;
    const isWatching = !!caller && 'watch' in caller && caller.watch;
    process.env.BABEL_ENV = process.env.BABEL_ENV || (isProduction ? 'production' : 'development');

    var entry = entryNames.reduce((obj, d) => {
        obj[d] = `./src/js/${d}.js`;
        return obj;
    }, {});

    var plugins = [
        new ExtractTextPlugin({
            filename: isProduction ? `css/[name].${version}.min.css` : 'css/[name].css',
        }),
    ];

    plugins = plugins.concat(entryNames.map((chunk) =>

        new HtmlWebpackPlugin({
            filename: chunk + '.html',
            template: `./src/templates/${chunk}.hbs`,
            inject: true,
            chunks: [chunk],
            params: {
                chunkName: chunk,
            },
        })

    ));

    if (isWatching) {

        var app = express();
        app.use(express.static('dist'));
        app.get('/favicon.ico', (req, res) => res.sendStatus(204));
        app.listen(8000, '0.0.0.0', function () {
            console.log('Dev server listening on http://localhost:8000/'); // eslint-disable-line no-console
        });

        plugins.push(new LiveReloadPlugin({
            ignore: /\.(js|map|html)$/,
        }));
    }
    else {
        // plugins.push(new WebpackCleanupPlugin({
        //     exclude: ['**/.gitkeep',],
        // }));
    }

    if (isProduction) {
        // plugins.push(new BundleAnalyzerPlugin());
    }

    var config = {

        context: __dirname,

        entry: entry,

        output: {

            path: path.resolve(__dirname, 'dist/'),
            filename: (isProduction) ? `js/[name].${version}.min.js` : 'js/[name].js',
            libraryTarget: 'var',
            library: namespace,

        },

        plugins: plugins,

        resolve: {
            alias: {
                'modernizr': path.resolve(__dirname, ".modernizrrc"),
            },
            extensions: ['.tsx', '.ts', '.js'],
        },

        module: {

            rules: [
                {
                    test: /\.(js|jsx)$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.(c|sc|sa)ss$/,
                    loader: ExtractTextPlugin.extract({
                        use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    sourceMap: !isProduction
                                }
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    plugins: () => [require('autoprefixer')],
                                    sourceMap: !isProduction
                                }
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: !isProduction,
                                }
                            },
                        ],
                        publicPath: '../',
                    }),
                },

                {
                    test: /\.(hbs|handlebars)$/,
                    use: [{
                        loader: "handlebars-loader",
                    }],
                },

                {
                    test: /\.modernizrrc$/,
                    loader: "modernizr-loader!json-loader"
                },

                {
                    test: /\.(png|jpe?g|gif|svg|csv|json|mp4|webm)$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                name: '[path][name].[ext]',
                                context: './src'
                            },
                        },
                    ],
                },
            ]
        },

        devtool: !isProduction && 'cheap-module-source-map',

        watchOptions: {
            ignored: /node_modules/,
        },

        stats: {
            assets: true,
            modules: false,
            children: false,
        },

    };

    return config;

};

