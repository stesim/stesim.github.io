var shaders = {};

shaders.floor1 = new THREE.ShaderMaterial(
{
	uniforms:
	{
		"fIntensity": { type: "f", value: 1.0 },
		"fLines": { type: "f", value: 42.0 }
	},

	vertexShader:
	[
		"varying vec2 vUv;",

		"void main()",
		"{",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),

	fragmentShader:
	[
		"uniform float fIntensity;",
		"uniform float fLines;",

		"varying vec2 vUv;",

		"#define M_PI 3.1415926535897932384626433832795",

		"float componentValue( float x )",
		"{",
			"return pow( abs ( sin( x * fLines * M_PI ) ), 100.0 );",
		"}",

		"void main()",
		"{",
			"vec4 color = vec4( 1.0, 0.0, 0.0, 1.0 );",
			"gl_FragColor = color * fIntensity *",
				"max( componentValue( vUv.x ), componentValue( vUv.y ) );",
			"gl_FragColor.a = 1.0;",
		"}"
	].join( "\n" )
} );
