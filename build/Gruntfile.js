// http://gruntjs.com/configuring-tasks
module.exports = function( grunt )
{
	var date = new Date();
	var date_str = date
		.toISOString()
		.split('.')[0]
		.replace(/-/g, '')
		.replace('T','_')
		.split(':')
		.slice(0, 2)
		.join('');

	var distPath = '../dist/' + date_str + '/';
	var inline_import_files = { };
	inline_import_files[distPath + 'styles/main.min.css'] = [ '../styles/main.css' ];

	var grunt_configuration = {
		pkg: grunt.file.readJSON( '../package.json' ),
		requirejs: {
			index: {
				options: {
					name: 'lib/almond-0.2.6',
					include: 'main',
					baseUrl: '../scripts/',
					mainConfigFile: '../scripts/main.js',
					out: distPath + 'scripts/main.min.js',
					wrap: true
				}
			}
		},
		cssmin: {
			inline_import: {
				files: inline_import_files
			}
		},
		copy: {
			copy_html: {
				options: { processContent: updateHTML },
				files: [
					{ src: [ '../index.html' ], dest: distPath + 'index.html' }
				]
			}
		},
		imagemin: {
			jpg: {
				options: { progressive: true },
				files: [
					{
						expand: true,
						cwd: '../',
						src: [ '**/*.jpg', '!**/dist/**', '!**/node_modules/**' ],
						dest: distPath,
						ext: '.jpg'
					}
				]
			}
		}
	};

	function updateHTML( content, path )
	{
		if ( path === '../index.html' )
		{
			content = content
				.replace( 'href="styles/main.css"', 'href="styles/main.min.css"' )
				.replace( 'src="scripts/lib/require-2.1.4.js"', 'src="scripts/main.min.js"' )
				.replace( ' data-main="scripts/main"', '' );
		}

		return content;
	}

	grunt.initConfig( grunt_configuration );
	grunt.loadNpmTasks( 'grunt-contrib-requirejs' );
	grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-imagemin' );

	grunt.registerTask( 'default', [ 'requirejs', 'cssmin', 'copy', 'imagemin' ] );
	grunt.registerTask( 'production', [ 'requirejs', 'cssmin', 'copy', 'imagemin' ] );
	grunt.registerTask( 'js', [ 'requirejs' ] );
	grunt.registerTask( 'css', [ 'cssmin' ] );
	grunt.registerTask( 'cp', [ 'copy' ] );
	grunt.registerTask( 'img', [ 'imagemin' ] );
};