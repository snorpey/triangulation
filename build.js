const fs = require('fs');
const path = require('path');
const { rollup } = require('rollup');
const buble = require('@rollup/plugin-buble');
const UglifyJS = require('uglify-js');
const mkdirp = require('mkdirp');
const glob = require('glob');
// const ssri = require( 'ssri' );

const date = new Date();
const dateStr = date
	.toISOString()
	.split('.')[0]
	.replace(/-/g, '')
	.replace('T', '_')
	.split(':')
	.slice(0, 2)
	.join('');

const globalPath = 'assets/js';
const distPath = `dist/${dateStr}`;

const cssFilePath = 'assets/css/stylesheet.css';

build(globalPath, distPath, 'triangulate', 'main.js');

function build(srcPath, distPath, moduleName, mainJSFile) {
	const es6Params = {
		es6: true,
		minify: true,
		umd: false,
		srcPath,
		distPath,
		mainJSFile,
		moduleName,
	};

	const es5Params = {
		es6: false,
		minify: true,
		umd: true,
		srcPath,
		distPath,
		mainJSFile,
		moduleName,
	};

	const jsBuilds = [es6Params, es5Params];

	const es5OutputFileName = getOutputFileName(es5Params);
	const es6OutputFileName = getOutputFileName(es6Params);

	return Promise.all(jsBuilds.map(jsBuildParams => buildJS(jsBuildParams)))
		.then(() => processCSSFile(cssFilePath))
		.then(stylesStr => {
			// const ssriOptions = { algorithms: [ 'sha512' ] };

			// return Promise.all( [
			// 	ssri.fromStream( fs.createReadStream( path.join( distPath, es5OutputFileName ) ), ssriOptions ),
			// 	ssri.fromStream( fs.createReadStream( path.join( distPath, es6OutputFileName ) ), ssriOptions )
			// ] )
			// .then( ( [ es5Integrity, es6Integrity ] ) => {
			// 	return {
			// 		es5Hash: '', //es5Integrity.sha512[0].source,
			// 		es6Hash: '', //es6Integrity.sha512[0].source,
			// 		stylesStr
			// 	};
			// } );

			return { stylesStr };
		})
		.then(({ stylesStr /*, es5Hash, es6Hash*/ }) => {
			const htmlReplacements = {
				'<script src="assets/js/main.js" type="module"></script>': `
		<script src="${es6OutputFileName}" type="module"></script>
		<script nomodule src="${es5OutputFileName}"></script>`,
				'<link rel="stylesheet" href="assets/css/stylesheet.css" />': `<style>${stylesStr}</style>`,
			};

			const filesToCopy = [
				{
					from: 'index.html',
					to: distPath,
					replacements: htmlReplacements,
				},
				{
					from: 'assets/img/*.{jpg,png,ico}',
					to: distPath,
					encoding: 'binary',
				},
				{
					from: 'assets/img/*.svg',
					to: distPath,
					encoding: 'utf8',
				},
				{
					from: 'assets/*.xml',
					to: distPath,
					encoding: 'utf8',
				},
				{
					from: 'assets/*.json',
					to: distPath,
					encoding: 'utf8',
				},
			];

			return Promise.all(filesToCopy.map(item => copyFiles(item)));
		})
		.then(() => console.log(path.resolve(distPath)))
		.catch(err => console.log(err));
}

function buildJS(buildJSParams = {}) {
	const { srcPath, distPath, mainJSFile, es6, minify, moduleName } =
		buildJSParams;
	const outputFileName = getOutputFileName(buildJSParams);
	const outputFilePath = path.normalize(path.join(distPath, outputFileName));

	return processES6File(buildJSParams)
		.then(fileContent => {
			return processFileContent(fileContent, buildJSParams);
		})
		.then(fileContent => {
			return saveFile(outputFilePath, fileContent);
		});
}

function processES6File(buildJSParams = {}) {
	const { srcPath, mainJSFile, es6, moduleName } = buildJSParams;
	const mainFilePath = path.normalize(path.join(srcPath, mainJSFile));

	const rollupPlugins = [];

	if (!es6) {
		rollupPlugins.push(buble());
	}

	const rollupOptions = {
		input: mainFilePath,
		plugins: rollupPlugins,
	};

	const bundleFormat = es6 ? 'es' : 'umd';

	return rollup(rollupOptions)
		.then(bundle => {
			const bundleOpts = { format: bundleFormat };

			if (moduleName) {
				bundleOpts.name = moduleName;
			}

			return bundle.generate(bundleOpts).then(bundleData => {
				return bundleData.output[0].code;
			});
		})
		.catch(error => {
			throw error;
		});
}

function processFileContent(fileContent, buildJSParams = {}) {
	if (buildJSParams.minify) {
		return compressFileContent(fileContent);
	} else {
		return Promise.resolve(fileContent);
	}
}

function copyFiles(params = {}) {
	const srcGlob = path.join(params.from);
	const targetFolder = params.to;
	const encoding = params.encoding || 'utf8';
	const replacements = params.replacements;

	return listFiles(srcGlob)
		.then(({ pattern, filePaths }) => {
			return Promise.all(
				filePaths.map(filePath => {
					return loadFile(filePath, encoding);
				})
			);
		})
		.then(files => {
			return Promise.all(
				files.map(file => {
					const targetFolderPath = path.join(__dirname, targetFolder);
					const targetFilepath = path.normalize(
						path
							.resolve(file.filePath)
							.replace(__dirname, targetFolderPath)
					);

					if (
						replacements &&
						encoding === 'utf8' &&
						file.fileContent
					) {
						for (let search in replacements) {
							if (file.fileContent.indexOf(search) !== -1) {
								file.fileContent = file.fileContent.replace(
									search,
									replacements[search]
								);
							}
						}
					}

					return saveFile(targetFilepath, file.fileContent, encoding);
				})
			);
		});
}

function listFiles(pattern, options) {
	return new Promise((resolve, reject) => {
		glob(pattern, options, (err, filePaths) => {
			if (err) {
				reject(err);
			} else {
				resolve({ pattern, filePaths });
			}
		});
	});
}

function loadFile(filePath, encoding = 'utf8') {
	return new Promise(function (resolve, reject) {
		fs.readFile(filePath, encoding, (err, fileContent) => {
			if (err) {
				reject(err);
			} else {
				resolve({ filePath, fileContent });
			}
		});
	});
}

function saveFile(filePath, fileContent, encoding = 'utf8') {
	const folderName = path.dirname(filePath);

	return mkdirp(folderName).then(() => {
		return new Promise((resolve, reject) => {
			fs.writeFile(filePath, fileContent, encoding, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve({ filePath, fileContent });
				}
			});
		});
	});
}

function compressFileContent(fileContent) {
	const res = UglifyJS.minify(fileContent);

	if (res.error) {
		throw res.error;
	}

	return res.code;
}

function getOutputFileName({ es6, minify, moduleName }) {
	let appendixParts = [];

	if (es6) {
		appendixParts.push('esm');
	}

	if (minify) {
		appendixParts.push('min');
	}

	const appendix = appendixParts.join('.');

	if (appendixParts.length) {
		return `${moduleName}-${appendix}.js`;
	}

	return `${moduleName}.js`;
}

function getFileName(filePath, removeExtension = true) {
	if (removeExtension) {
		const extension = extname(filePath);
		return path.basename(filePath, extension);
	} else {
		return path.basename(filePath);
	}
}

// CSS
const postcss = require('postcss');
const importCss = require('postcss-import');
const cleanCss = require('cssnano');

function processCSSFile(filePath) {
	return loadFile(filePath)
		.then(file => {
			return postcss([importCss, cleanCss]).process(file.fileContent, {
				from: filePath,
			});
		})
		.then(res => {
			const fileContent = res.css.replace(/\(..\/..\//gm, '(../');
			return fileContent;
		});
}
