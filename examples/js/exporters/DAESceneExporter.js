/**
 * Translated from ASSIMP by emilesonneveld
 */
"use strict";
THREE.DAESceneExporter = function () {};

THREE.DAESceneExporter.prototype = {

	constructor: THREE.DAESceneExporter,

	parse: function ( pScene ) {

	//   BEGIN Inline parser object


	// ------------------------------------------------------------------------------------------------
	// Reimplementation of isalnum(,C locale), because AppVeyor does not see standard version.
	//static bool 
	var isalnum_C = function(c)
	{
	  return "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(c)>0;
	}
	var XMLEscape = function (str) {
		return str.replace(/&apos;/g, "'")
				   .replace(/&quot;/g, '"')
				   .replace(/&gt;/g, '>')
				   .replace(/&lt;/g, '<')
				   .replace(/&amp;/g, '&');
	  };

	var AI_MAX_NUMBER_OF_TEXTURECOORDS = 8;
	var AI_MAX_NUMBER_OF_COLOR_SETS = 8;


	var FloatType_Vector = "FloatType_Vector";
	var FloatType_TexCoord2 = "FloatType_TexCoord2";
	var FloatType_TexCoord3 = "FloatType_TexCoord3";
	var FloatType_Color = "FloatType_Color";

	var aiShadingMode_Flat = 0x1;
	var aiShadingMode_Gouraud = 0x2;
	var aiShadingMode_Phong = 0x3;
	var aiShadingMode_Blinn = 0x4;
	var aiShadingMode_Toon = 0x5;
	var aiShadingMode_OrenNayar = 0x6;
	var aiShadingMode_Minnaert = 0x7;
	var aiShadingMode_CookTorrance = 0x8;
	var aiShadingMode_NoShading = 0x9;
	var aiShadingMode_Fresnel = 0xa;

	var AI_RAD_TO_DEG = function(x) {return x*57.2957795;}

	function setCharAt(str,index,chr) {
		if(index > str.length-1) return str;
		return str.substring(0,index) + chr + str.substring(index+1);
	}

	var ColladaExporter = function () {};

	ColladaExporter.prototype = {


		/// Enters a new xml element, which increases the indentation
		PushTag: function() { this.startstr+=( "  "); },
		/// Leaves an element, decreasing the indentation
		PopTag: function() { if( this.startstr.length > 1) {this.startstr = this.startstr.substring(2); /*SKIPPED IN TRANSLATION this.startstr.erase( this.startstr.length() - 2);*/} },

		/// Creates a mesh ID for the given mesh
		GetMeshId: function( pIndex) {
			return  "meshId" + pIndex;
		},

		/// Stringstream to write all output into
		//std::stringstream 
		mOutput: "",

		/// The IOSystem for output
		//IOSystem* 
		//this.mIOSystem: {},

		/// Path of the directory where the scene will be exported
		//var 
		//this.mPath: "",

		/// Name of the file (without extension) where the scene will be exported
		//var 
		//this.mFile: "",

		/// The scene to be written
		//const aiScene* 
		mScene: null,
		//bool 
		mSceneOwned: false,

		/// current line start string, contains the current indentation for simple stream insertion
		//var 
		startstr :"",
		/// current line end string for simple stream insertion
		//var 
		endstr:"\n",

		//std::vector<Material> 
		materials: [],

		//std::map<unsigned int, std::string> 
		textures: [],

	collectedGeoms: [],
	// ------------------------------------------------------------------------------------------------
	// Constructor for a specific scene to export
	// returns 
	/*ColladaExporter: function( pScene, pIOSystem, path, file) //: mIOSystem(pIOSystem), mPath(path), mFile(file)
	{
		// make sure that all formatting happens using the standard, C locale and not the user's current locale
		//this.mOutput.imbue( std::locale("C") );
		//this.mOutput.precision(16);

		this.mScene = pScene;
		
		// start writing
		this.WriteFile();
	},*/

	// ------------------------------------------------------------------------------------------------
	// Destructor
	// returns 
	/*~ColladaExporter: function()
	{
		if(this.mSceneOwned) {
			delete this.mScene;
		}
	}*/

	// ------------------------------------------------------------------------------------------------
	// Starts writing the contents
	WriteFile: function()
	{
		// write the DTD
		this.mOutput += "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\" ?>" + this.endstr;
		// COLLADA element start
		this.mOutput += "<COLLADA xmlns=\"http://www.collada.org/2005/11/COLLADASchema\" version=\"1.4.1\">" + this.endstr;
		this.PushTag();

		this.WriteTextures();
		this.WriteHeader();

		this.WriteCamerasLibrary();
		this.WriteLightsLibrary();
		this.WriteMaterials();
		this.WriteGeometryLibrary();

		this.WriteSceneLibrary();

		// useless Collada fu at the end, just in case we haven't had enough indirections, yet.
		this.mOutput += this.startstr + "<scene>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<instance_visual_scene url=\"#" + XMLEscape(this.mScene.name) + "\" />" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</scene>" + this.endstr;
		this.PopTag();
		this.mOutput += "</COLLADA>" + this.endstr;
	},

	// ------------------------------------------------------------------------------------------------
	// Writes the asset header
	WriteHeader: function()
	{
		var  epsilon = 0.00001; // ai_real is something like float
		var x_mat = new THREE.Matrix4(); x_mat.set(
			0, -1,  0,  0,
			1,  0,  0,  0,
			0,  0,  1,  0,
			0,  0,  0,  1);
		var x_rot = new THREE.Quaternion(); x_rot.setFromRotationMatrix(x_mat);

		var y_mat = new THREE.Matrix4(); y_mat.set(
			1,  0,  0,  0,
			0,  1,  0,  0,
			0,  0,  1,  0,
			0,  0,  0,  1);
		var y_rot = new THREE.Quaternion(); y_rot.setFromRotationMatrix(y_mat);

		var z_mat = new THREE.Matrix4(); z_mat.set(
			1,  0,  0,  0,
			0,  0,  1,  0,
			0, -1,  0,  0,
			0,  0,  0,  1);
		var z_rot = new THREE.Quaternion(); z_rot.setFromRotationMatrix(z_mat);

		var date_nb_chars = 20;
		var date_str = [];
		var date = "to translat"; //std::time(null);
		//std::strftime(date_str, date_nb_chars, "%Y-%m-%dT%H:%M:%S", std::localtime(&date));

		var scaling = new THREE.Vector3();
		var rotation = new THREE.Quaternion();;
		var position = new THREE.Vector3();
		this.mScene.matrix.decompose(scaling, rotation, position);
		rotation.normalize();

		var add_root_node = false;

		var scale = 1.0; // ai_real
		if(Math.abs(scaling.x - scaling.y) <= epsilon && Math.abs(scaling.x - scaling.z) <= epsilon && Math.abs(scaling.y - scaling.z) <= epsilon) {
			scale = (scaling.x + scaling.y + scaling.z) / 3.0;
		} else {
			add_root_node = true;
		}

		var up_axis = "Y_UP";
		if(rotation.equals(x_rot /*, epsilon*/)) {
			up_axis = "X_UP";
		} else if(rotation.equals(y_rot /*, epsilon*/)) {
			up_axis = "Y_UP";
		} else if(rotation.equals(z_rot /*, epsilon*/)) {
			up_axis = "Z_UP";
		} else {
			add_root_node = true;
		}

		if(!position.equals(new THREE.Vector3(0, 0, 0))) {
			add_root_node = true;
		}

		if(this.mScene.children.length == 0) {
			add_root_node = true;
		}

		if(add_root_node) { // TODO
			var scene = this.mScene; //.clone(); // new THREE.Scene
			//SceneCombiner::CopyScene(&scene, this.mScene);

			var root = new THREE.Object3D("Scene");
			root.children.push( scene );
			//root.mChildren[0] = scene.mRootNode;
			scene.parent = root;
			//scene.mRootNode = root;

			this.mScene = scene;
			this.mSceneOwned = true;

			up_axis = "Y_UP";
			scale = 1.0;
		}

		this.mOutput += this.startstr + "<asset>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<contributor>" + this.endstr;
		this.PushTag();

		//var meta = this.mScene.mRootNode.mMetaData;
		//var value;
		//if (!meta || !meta.Get("Author", value))
			this.mOutput += this.startstr + "<author>" + "Emile" + "</author>" + this.endstr;
		//else
		//    this.mOutput += this.startstr + "<author>" + XMLEscape(value) + "</author>" + this.endstr;

		//if (!meta || !meta.Get("AuthoringTool", value))
			this.mOutput += this.startstr + "<authoring_tool>" + "Three JS Assimp Exporter" + "</authoring_tool>" + this.endstr;
		//else
		//    this.mOutput += this.startstr + "<authoring_tool>" + XMLEscape(value) + "</authoring_tool>" + this.endstr;

		//this.mOutput += this.startstr + "<author>" + this.mScene.author + "</author>" + this.endstr;
		//this.mOutput += this.startstr + "<authoring_tool>" + this.mScene.authoringTool + "</authoring_tool>" + this.endstr;

		this.PopTag();
		this.mOutput += this.startstr + "</contributor>" + this.endstr;
		this.mOutput += this.startstr + "<created>" + date_str + "</created>" + this.endstr;
		this.mOutput += this.startstr + "<modified>" + date_str + "</modified>" + this.endstr;
		this.mOutput += this.startstr + "<unit name=\"meter\" meter=\"" + scale + "\" />" + this.endstr;
		this.mOutput += this.startstr + "<up_axis>" + up_axis + "</up_axis>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</asset>" + this.endstr;
	},

	// ------------------------------------------------------------------------------------------------
	// Write the embedded this.textures
	WriteTextures: function() {
		var buffer_size = 1024;
		var str = [];

		/*if(this.mScene.HasTextures()) {
			for(var i = 0; i < this.mScene.mNumTextures; i++) {
				// It would be great to be able to create a directory in portable standard C++, but it's not the case,
				// so we just write the textures in the current directory.

				 SKIP IN TRANSLATION
				var texture = this.mScene.mTextures[i];

				ASSIMP_itoa10(str, buffer_size, i + 1);

				var name = this.mFile + "_texture_" + (i < 1000 ? "0" : "") + (i < 100 ? "0" : "") + (i < 10 ? "0" : "") + str + "." + ((const char*) texture.achFormatHint);

				var outfile(this.mIOSystem.Open(this.mPath + name, "wb"));
				if(outfile == null) {
					throw DeadlyExportError("could not open output texture file: " + this.mPath + name);
				}

				if(texture.mHeight == 0) {
					outfile.Write( texture.pcData, texture.mWidth, 1);
				} else {
					Bitmap::Save(texture, outfile.get());
				}

				outfile.Flush();

				this.textures.insert(std::make_pair(i, name));
			}
		}*/
	},

	// ------------------------------------------------------------------------------------------------
	// Write the embedded cameras
	WriteCamerasLibrary: function() {
		var collectedCams = [];
		this.mScene.traverse( function ( object ) {
			if ( object instanceof THREE.Mesh ) {
				if(object.type == "PerspectiveCamera")
					collectedCams.push(object);
			}
		}.bind(this));

		if(collectedCams.length > 0)
		{

			this.mOutput += this.startstr + "<library_cameras>" + this.endstr;
			this.PushTag();

			//for( var a = 0; a < this.mScene.mNumCameras; ++a)
			//    this.WriteCamera( a);
			//this.WriteCamera( 0);

			this.PopTag();
			this.mOutput += this.startstr + "</library_cameras>" + this.endstr;

		}
	},

	WriteCamera: function(pIndex){
		// WRITES THE EDITOR CAMERA INSTEAD OF THE SCENE CAMS!
		var cam = editor.camera; //this.mScene.mCameras[pIndex];
		var idstrEscaped = XMLEscape(cam.name);

		this.mOutput += this.startstr + "<camera id=\"" + idstrEscaped + "-camera\" name=\"" + idstrEscaped + "_name\" >" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<optics>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<technique_common>" + this.endstr;
		this.PushTag();
		//assimp doesn't support the import of orthographic cameras! se we write
		//always perspective
		this.mOutput += this.startstr + "<perspective>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<xfov sid=\"xfov\">"+
									AI_RAD_TO_DEG(cam.fov)
							+"</xfov>" + this.endstr;
		this.mOutput += this.startstr + "<aspect_ratio>"
							+      cam.aspect
							+ "</aspect_ratio>" + this.endstr;
		this.mOutput += this.startstr + "<znear sid=\"znear\">"
							+      cam.near
							+  "</znear>" + this.endstr;
		this.mOutput += this.startstr + "<zfar sid=\"zfar\">"
							+      cam.far
							+ "</zfar>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</perspective>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</technique_common>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</optics>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</camera>" + this.endstr;

	},


	// ------------------------------------------------------------------------------------------------
	// Write the embedded lights
	WriteLightsLibrary: function() {
		
		var colectedLights = [];
		this.mScene.traverse( function ( object ) {
			if ( object instanceof THREE.Mesh ) {
				if(object.type == "PointLight")
					colectedLights.push(object);
			}
		}.bind(this));

		if(colectedLights.length > 0) {

			this.mOutput += this.startstr + "<library_lights>" + this.endstr;
			this.PushTag();
			// TODO
			//for( var a = 0; a < this.mScene.mNumLights; ++a)
			//    this.WriteLight( a);

			this.PopTag();
			this.mOutput += this.startstr + "</library_lights>" + this.endstr;
		}
	},

	WriteLight: function(pIndex){

		var light = this.mScene.mLights[pIndex];
		var idstrEscaped = XMLEscape(light.mName);

		this.mOutput += this.startstr + "<light id=\"" + idstrEscaped + "-light\" name=\""
				+ idstrEscaped + "_name\" >" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<technique_common>" + this.endstr;
		this.PushTag();
		switch(light.mType){
			case aiLightSource_AMBIENT:
				this.WriteAmbienttLight(light);
				break;
			case aiLightSource_DIRECTIONAL:
				this.WriteDirectionalLight(light);
				break;
			case aiLightSource_POINT:
				this.WritePointLight(light);
				break;
			case aiLightSource_SPOT:
				this.WriteSpotLight(light);
				break;
			case aiLightSource_AREA:
			case aiLightSource_UNDEFINED:
			case _aiLightSource_Force32Bit:
				break;
		}
		this.PopTag();
		this.mOutput += this.startstr + "</technique_common>" + this.endstr;

		this.PopTag();
		this.mOutput += this.startstr + "</light>" + this.endstr;

	},

	WritePointLight: function(light){
		var color=  light.mColorDiffuse;
		this.mOutput += this.startstr + "<point>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<color sid=\"color\">"
								+ color.r+" "+color.g+" "+color.b
							+"</color>" + this.endstr;
		this.mOutput += this.startstr + "<constant_attenuation>"
								+ light.mAttenuationConstant
							+"</constant_attenuation>" + this.endstr;
		this.mOutput += this.startstr + "<linear_attenuation>"
								+ light.mAttenuationLinear
							+"</linear_attenuation>" + this.endstr;
		this.mOutput += this.startstr + "<quadratic_attenuation>"
								+ light.mAttenuationQuadratic
							+"</quadratic_attenuation>" + this.endstr;

		this.PopTag();
		this.mOutput += this.startstr + "</point>" + this.endstr;

	},
	WriteDirectionalLight: function(light){
		var color=  light.mColorDiffuse;
		this.mOutput += this.startstr + "<directional>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<color sid=\"color\">"
								+ color.r+" "+color.g+" "+color.b
							+"</color>" + this.endstr;

		this.PopTag();
		this.mOutput += this.startstr + "</directional>" + this.endstr;

	},
	WriteSpotLight: function(light){

		var color=  light.mColorDiffuse;
		this.mOutput += this.startstr + "<spot>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<color sid=\"color\">"
								+ color.r+" "+color.g+" "+color.b
							+"</color>" + this.endstr;
		this.mOutput += this.startstr + "<constant_attenuation>"
									+ light.mAttenuationConstant
								+"</constant_attenuation>" + this.endstr;
		this.mOutput += this.startstr + "<linear_attenuation>"
								+ light.mAttenuationLinear
							+"</linear_attenuation>" + this.endstr;
		this.mOutput += this.startstr + "<quadratic_attenuation>"
								+ light.mAttenuationQuadratic
							+"</quadratic_attenuation>" + this.endstr;
		/*
		out.mAngleOuterCone = AI_DEG_TO_RAD (std::acos(std::pow(0.1f,1.f/srcLight.mFalloffExponent))+
								srcLight.mFalloffAngle);
		*/

		var fallOffAngle = AI_RAD_TO_DEG(light.mAngleInnerCone); // ai_real
		this.mOutput += this.startstr +"<falloff_angle sid=\"fall_off_angle\">"
									+ fallOffAngle
							+"</falloff_angle>" + this.endstr;
		var temp = light.mAngleOuterCone-light.mAngleInnerCone;

		temp = Math.cos(temp);
		temp = Math.log(temp)/Math.log(0.1);
		temp = 1/temp;
		this.mOutput += this.startstr + "<falloff_exponent sid=\"fall_off_exponent\">"
								+ temp
							+"</falloff_exponent>" + this.endstr;


		this.PopTag();
		this.mOutput += this.startstr + "</spot>" + this.endstr;

	},

	WriteAmbienttLight: function(light){

		var color=  light.mColorAmbient;
		this.mOutput += this.startstr + "<ambient>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<color sid=\"color\">"
								+ color.r+" "+color.g+" "+color.b
							+"</color>" + this.endstr;

		this.PopTag();
		this.mOutput += this.startstr + "</ambient>" + this.endstr;
	},

	// ------------------------------------------------------------------------------------------------
	// Reads a single surface entry from the given material keys
	ReadMaterialSurface: function(poSurface, pSrcMat, pTexture, pKey, pType, pIndex)
	{
	  /* SKIPPED IN TRANSLATION
	  if( pSrcMat.GetTextureCount( pTexture) > 0 )
	  {
		var texfile;
		var uvChannel = 0;
		pSrcMat.GetTexture( pTexture, 0, &texfile, null, &uvChannel);

		var index_str = (texfile);

		if(index_str.size() != 0 && index_str[0] == '*')
		{
			var index;

			index_str = index_str.substr(1, std::string::npos);

			try {
				index = strtoul10_64(index_str.c_str());
			} catch(error) {
				throw DeadlyExportError(error.what());
			}

			var name = this.textures.find(index); // std::map<unsigned int, std::string>::const_iterator

			if(name != this.textures.end()) {
				poSurface.texture = name.second;
			} else {
				throw DeadlyExportError("could not find embedded texture at index " + index_str);
			}
		} else
		{
			poSurface.texture = texfile;
		}

		poSurface.channel = uvChannel;
		poSurface.exist = true;
	  } else
	  {
		if( pKey )
		  poSurface.exist = pSrcMat.Get( pKey, (pType), (pIndex), poSurface.color) == aiReturn_SUCCESS;
	  }
	  */
	},


	// ------------------------------------------------------------------------------------------------
	// Writes an image entry for the given surface
	WriteImageEntry: function(pSurface, pNameAdd)
	{
	  if( !pSurface.texture.empty() )
	  {
		this.mOutput += this.startstr + "<image id=\"" + XMLEscape(pNameAdd) + "\">" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<init_from>";

		// URL encode image file name first, then XML encode on top
		var imageUrlEncoded; // std::stringstream
		//for( std::string::const_iterator it = pSurface.texture.begin(); it != pSurface.texture.end(); ++it )
		
		for( var a = 0; a < pSurface.texture; ++a )
		{
			it = pSurface.texture[a];
			if( isalnum_C(it) || it == ':' || it == '_' || it == '.' || it == '/' || it == '\\' )
				imageUrlEncoded + it;
			else
				imageUrlEncoded + '%' + it.to_string(8);
		}
		this.mOutput += XMLEscape(imageUrlEncoded);
		this.mOutput += "</init_from>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</image>" + this.endstr;
	  }
	},

	// ------------------------------------------------------------------------------------------------
	// Writes a color-or-texture entry into an effect definition
	WriteTextureColorEntry: function(pSurface, pTypeName, pImageName)
	{
		return;
	  if(pSurface.exist) {
		this.mOutput += this.startstr + "<" + pTypeName + ">" + this.endstr;
		this.PushTag();
		if( pSurface.texture.empty() )
		{
		  this.mOutput += this.startstr + "<color sid=\"" + pTypeName + "\">" + pSurface.color.r + "   " + pSurface.color.g + "   " + pSurface.color.b + "   " + pSurface.color.a + "</color>" + this.endstr;
		}
		else
		{
		  this.mOutput += this.startstr + "<texture texture=\"" + XMLEscape(pImageName) + "\" texcoord=\"CHANNEL" + pSurface.channel + "\" />" + this.endstr;
		}
		this.PopTag();
		this.mOutput += this.startstr + "</" + pTypeName + ">" + this.endstr;
	  }
	},

	// ------------------------------------------------------------------------------------------------
	// Writes the two parameters necessary for referencing a texture in an effect entry
	WriteTextureParamEntry: function( pSurface,  pTypeName, pMatName)
	{
		return;
	  // if surface is a texture, write out the sampler and the surface parameters necessary to reference the texture
	  if( !pSurface.texture.empty() )
	  {
		this.mOutput += this.startstr + "<newparam sid=\"" + XMLEscape(pMatName) + "-" + pTypeName + "-surface\">" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<surface type=\"2D\">" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<init_from>" + XMLEscape(pMatName) + "-" + pTypeName + "-image</init_from>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</surface>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</newparam>" + this.endstr;

		this.mOutput += this.startstr + "<newparam sid=\"" + XMLEscape(pMatName) + "-" + pTypeName + "-sampler\">" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<sampler2D>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<source>" + XMLEscape(pMatName) + "-" + pTypeName + "-surface</source>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</sampler2D>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</newparam>" + this.endstr;
	  }
	},

	// ------------------------------------------------------------------------------------------------
	// Writes a scalar property
	WriteFloatEntry: function( pProperty, pTypeName)
	{
		return;
		if(pProperty.exist) {
			this.mOutput += this.startstr + "<" + pTypeName + ">" + this.endstr;
			this.PushTag();
			this.mOutput += this.startstr + "<float sid=\"" + pTypeName + "\">" + pProperty.value + "</float>" + this.endstr;
			this.PopTag();
			this.mOutput += this.startstr + "</" + pTypeName + ">" + this.endstr;
		}
	},

	// ------------------------------------------------------------------------------------------------
	// Writes the material setup
	WriteMaterials: function()
	{
	  
		var sceneMaterials = [];
		this.mScene.traverse( function ( object ) {
		if ( object instanceof THREE.Mesh )
		{
			if(object.material)
				sceneMaterials.push(object.material);
		  }
		}.bind(this));

	  this.materials = []; //.resize( this.mScene.mNumMaterials);
	  for (var i = sceneMaterials.length - 1; i >= 0; i--) {
		  this.materials.push({});
	  }
	  /// collect all this.materials from the scene
	  var numTextures = 0;
	  for( var a = 0; a < sceneMaterials.length; ++a )
	  {
		var mat = sceneMaterials[a];

		var name = mat.name;
		//if( mat.Get( AI_MATKEY_NAME, name) != aiReturn_SUCCESS ) {
		if( name == null ) {
		  name = "mat";
		  this.materials[a].name = ( "m") + (a) + name;
		} else {
		  // try to use the material's name if no other material has already taken it, else append #
		  var testName = name;
		  var materialCountWithThisName = 0;
		  for( var i = 0; i < a; i ++ ) {
			if( this.materials[i].name == testName ) {
			  materialCountWithThisName ++;
			}
		  }
		  if( materialCountWithThisName == 0 ) {
			this.materials[a].name = name;
		  } else {
			this.materials[a].name = (name) + (materialCountWithThisName);  
		  }
		}
		//for( std::string::iterator it = this.materials[a].name.begin(); it != this.materials[a].name.end(); ++it ) {
		for (var i = 0, len = this.materials[a].name.length; i < len; i++)
		{
		  //var mat = this.materials.name[i];
		  if( !isalnum_C( this.materials[a].name[i] ) ) {
		  	this.materials[a].name = setCharAt(this.materials[a].name, i, '_'); // could potatntialy make name colitions
			//this.materials[a].name[i] = '_'
		  }
		}


		var shading = aiShadingMode_Flat;
		this.materials[a].shading_model = "phong";
		if(mat.shading) {
			// TODO
			//"THREE.FlatShading" : THREE.FlatShading,
			//"THREE.SmoothShading" : THREE.SmoothShading

			// if(shading == aiShadingMode_Phong) {
			//     this.materials[a].shading_model = "phong";
			// } else if(shading == aiShadingMode_Blinn) {
			//     this.materials[a].shading_model = "blinn";
			// } else if(shading == aiShadingMode_NoShading) {
			//     this.materials[a].shading_model = "constant";
			// } else if(shading == aiShadingMode_Gouraud) {
			//     this.materials[a].shading_model = "lambert";
			// }
		}

		/*
		this.ReadMaterialSurface( this.materials[a].ambient, mat, aiTextureType_AMBIENT, AI_MATKEY_COLOR_AMBIENT);
		if( !this.materials[a].ambient.texture.empty() ) numTextures++;
		this.ReadMaterialSurface( this.materials[a].diffuse, mat, aiTextureType_DIFFUSE, AI_MATKEY_COLOR_DIFFUSE);
		if( !this.materials[a].diffuse.texture.empty() ) numTextures++;
		this.ReadMaterialSurface( this.materials[a].specular, mat, aiTextureType_SPECULAR, AI_MATKEY_COLOR_SPECULAR);
		if( !this.materials[a].specular.texture.empty() ) numTextures++;
		this.ReadMaterialSurface( this.materials[a].emissive, mat, aiTextureType_EMISSIVE, AI_MATKEY_COLOR_EMISSIVE);
		if( !this.materials[a].emissive.texture.empty() ) numTextures++;
		this.ReadMaterialSurface( this.materials[a].reflective, mat, aiTextureType_REFLECTION, AI_MATKEY_COLOR_REFLECTIVE);
		if( !this.materials[a].reflective.texture.empty() ) numTextures++;
		this.ReadMaterialSurface( this.materials[a].transparent, mat, aiTextureType_OPACITY, AI_MATKEY_COLOR_TRANSPARENT);
		if( !this.materials[a].transparent.texture.empty() ) numTextures++;
		this.ReadMaterialSurface( this.materials[a].normal, mat, aiTextureType_NORMALS, null, 0, 0);
		if( !this.materials[a].normal.texture.empty() ) numTextures++;

		this.materials[a].shininess.exist = mat.Get( AI_MATKEY_SHININESS, this.materials[a].shininess.value) == aiReturn_SUCCESS;
		this.materials[a].transparency.exist = mat.Get( AI_MATKEY_OPACITY, this.materials[a].transparency.value) == aiReturn_SUCCESS;
		this.materials[a].transparency.value = this.materials[a].transparency.value;
		this.materials[a].index_refraction.exist = mat.Get( AI_MATKEY_REFRACTI, this.materials[a].index_refraction.value) == aiReturn_SUCCESS;
		*/
	  }

	  // output this.textures if present
	  if( numTextures > 0 )
	  {
		this.mOutput += this.startstr + "<library_images>" + this.endstr;
		this.PushTag();
		//for( std::vector<Material>::const_iterator it = this.materials.begin(); it != this.materials.end(); ++it )
		for (var i = 0, len = this.materials.length; i < len; i++)
		{
		  var mat = this.materials[i];
		  //const Material& mat = it;
		  this.WriteImageEntry( mat.ambient, mat.name + "-ambient-image");
		  this.WriteImageEntry( mat.diffuse, mat.name + "-diffuse-image");
		  this.WriteImageEntry( mat.specular, mat.name + "-specular-image");
		  this.WriteImageEntry( mat.emissive, mat.name + "-emission-image");
		  this.WriteImageEntry( mat.reflective, mat.name + "-reflective-image");
		  this.WriteImageEntry( mat.transparent, mat.name + "-transparent-image");
		  this.WriteImageEntry( mat.normal, mat.name + "-normal-image");
		}
		this.PopTag();
		this.mOutput += this.startstr + "</library_images>" + this.endstr;
	  }

	  // output effects - those are the actual carriers of information
	  if( this.materials.length > 0 )
	  {
		this.mOutput += this.startstr + "<library_effects>" + this.endstr;
		this.PushTag();
		//for( std::vector<Material>::const_iterator it = this.materials.begin(); it != this.materials.end(); ++it )
		for (var i = 0, len = this.materials.length; i < len; i++)
		{
		  var mat = this.materials[i];
		  //const Material& mat = it;
		  // this is so ridiculous it must be right
		  this.mOutput += this.startstr + "<effect id=\"" + XMLEscape(mat.name) + "-fx\" name=\"" + XMLEscape(mat.name) + "\">" + this.endstr;
		  this.PushTag();
		  this.mOutput += this.startstr + "<profile_COMMON>" + this.endstr;
		  this.PushTag();

		  // write sampler- and surface params for the texture entries
		  this.WriteTextureParamEntry( mat.emissiveIntensity, "emission", mat.name);
		  //this.WriteTextureParamEntry( mat.ambient, "ambient", mat.name);//
		  //this.WriteTextureParamEntry( mat.diffuse, "diffuse", mat.name);//
		  //this.WriteTextureParamEntry( mat.specular, "specular", mat.name);//
		  this.WriteTextureParamEntry( mat.reflectivity, "reflective", mat.name);
		  this.WriteTextureParamEntry( mat.transparent, "transparent", mat.name);
		  //this.WriteTextureParamEntry( mat.normal, "normal", mat.name);//

		  this.mOutput += this.startstr + "<technique sid=\"standard\">" + this.endstr;
		  this.PushTag();
		  this.mOutput += this.startstr + "<" + mat.shading_model + ">" + this.endstr;
		  this.PushTag();

		  this.WriteTextureColorEntry( mat.emissive, "emission", mat.name + "-emission-sampler");
		  //this.WriteTextureColorEntry( mat.ambient, "ambient", mat.name + "-ambient-sampler");
		  //this.WriteTextureColorEntry( mat.diffuse, "diffuse", mat.name + "-diffuse-sampler");
		  this.WriteTextureColorEntry( mat.specular, "specular", mat.name + "-specular-sampler");
		  this.WriteFloatEntry(mat.shininess, "shininess");
		  //this.WriteTextureColorEntry( mat.reflective, "reflective", mat.name + "-reflective-sampler");
		  //this.WriteTextureColorEntry( mat.transparent, "transparent", mat.name + "-transparent-sampler");
		  this.WriteFloatEntry(mat.transparency, "transparency");//
		  this.WriteFloatEntry(mat.index_refraction, "index_of_refraction");//

		  //if(! mat.normal.texture.empty()) {
		  //  this.WriteTextureColorEntry( mat.normal, "bump", mat.name + "-normal-sampler");
		  //}

		  this.PopTag();
		  this.mOutput += this.startstr + "</" + mat.shading_model + ">" + this.endstr;
		  this.PopTag();
		  this.mOutput += this.startstr + "</technique>" + this.endstr;
		  this.PopTag();
		  this.mOutput += this.startstr + "</profile_COMMON>" + this.endstr;
		  this.PopTag();
		  this.mOutput += this.startstr + "</effect>" + this.endstr;
		}
		this.PopTag();
		this.mOutput += this.startstr + "</library_effects>" + this.endstr;

		// write this.materials - they're just effect references
		this.mOutput += this.startstr + "<library_this.materials>" + this.endstr;
		this.PushTag();
		for (var i = 0, len = this.materials.length; i < len; i++)
		{
		  var mat = this.materials[i];
		  this.mOutput += this.startstr + "<material id=\"" + XMLEscape(mat.name) + "\" name=\"" + mat.name + "\">" + this.endstr;
		  this.PushTag();
		  this.mOutput += this.startstr + "<instance_effect url=\"#" + XMLEscape(mat.name) + "-fx\"/>" + this.endstr;
		  this.PopTag();
		  this.mOutput += this.startstr + "</material>" + this.endstr;
		}
		this.PopTag();
		this.mOutput += this.startstr + "</library_this.materials>" + this.endstr;
	  }
	},

	// ------------------------------------------------------------------------------------------------
	// Writes the geometry library
	WriteGeometryLibrary: function()
	{
		this.mOutput += this.startstr + "<library_geometries>" + this.endstr;
		this.PushTag();

		this.mScene.traverse( function ( object ) {
			if ( object instanceof THREE.Mesh ) {
				if(object.geometry)
					this.collectedGeoms.push(object.geometry);
			}
		}.bind(this));
		//this.CollectGeometry(this.mScene);

		for( var a = 0; a < this.collectedGeoms.length; ++a)
			this.WriteGeometry( a);

		
		this.PopTag();
		this.mOutput += this.startstr + "</library_geometries>" + this.endstr;
	},

	// ------------------------------------------------------------------------------------------------
	// Writes the given mesh
	WriteGeometry: function( pIndex)
	{
		var mesh = this.collectedGeoms[pIndex]; // actually geometry
		var idstr = this.GetMeshId(pIndex);
		var idstrEscaped = XMLEscape(idstr);

		if( (mesh.faces && mesh.faces.count == 0) || mesh.attributes.position == undefined )
			return;

		// opening tag
		this.mOutput += this.startstr + "<geometry id=\"" + idstrEscaped + "\" name=\"" + idstrEscaped + "_name\" >" + this.endstr;
		this.PushTag();

		this.mOutput += this.startstr + "<mesh>" + this.endstr;
		this.PushTag();

		// Positions
		this.WriteFloatArray( idstr + "-positions", FloatType_Vector, mesh.attributes.position.array, mesh.attributes.position.count);
		// Normals, if any
		if( mesh.attributes.normal )
			this.WriteFloatArray( idstr + "-normals", FloatType_Vector, mesh.attributes.normal.array, mesh.attributes.normal.count);

		// texture coords
		/*for( var a = 0; a < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++a)
		{
			if( mesh.HasTextureCoords((a)) )
			{
				this.WriteFloatArray( idstr + "-tex" + to_string(a), mesh.mNumUVComponents[a] == 3 ? FloatType_TexCoord3 : FloatType_TexCoord2,
					mesh.mTextureCoords[a], mesh.mNumVertices);
			}
		}*/

		// vertex colors
		/*for( var a = 0; a < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++a)
		{
			if( mesh.HasVertexColors((a)) )
				this.WriteFloatArray( idstr + "-color" + to_string(a), FloatType_Color, mesh.mColors[a], mesh.mNumVertices);
		}*/

		// assemble vertex structure
		this.mOutput += this.startstr + "<vertices id=\"" + idstrEscaped + "-vertices" + "\">" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<input semantic=\"POSITION\" source=\"#" + idstrEscaped + "-positions\" />" + this.endstr;
		if( mesh.attributes.normal )
			this.mOutput += this.startstr + "<input semantic=\"NORMAL\" source=\"#" + idstrEscaped + "-normals\" />" + this.endstr;
		// for( var a = 0; a < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++a )
		// {
		//     if( mesh.HasTextureCoords((a)) )
		//         this.mOutput += this.startstr + "<input semantic=\"TEXCOORD\" source=\"#" + idstrEscaped + "-tex" + a + "\" " /*+ "set=\"" + a + "\"" */ + " />" + this.endstr;
		// }
		// for( var a = 0; a < AI_MAX_NUMBER_OF_COLOR_SETS; ++a )
		// {
		//     if( mesh.HasVertexColors((a) ) )
		//         this.mOutput += this.startstr + "<input semantic=\"COLOR\" source=\"#" + idstrEscaped + "-color" + a + "\" " /*+ set=\"" + a + "\"" */ + " />" + this.endstr;
		// }

		this.PopTag();
		this.mOutput += this.startstr + "</vertices>" + this.endstr;

		// count the number of lines, triangles and polygon meshes
		var countLines = 0;
		var countPoly = 0;

		var mesh_faces = mesh.faces;
		if(!mesh_faces){
			var indices = mesh.getIndex();
			mesh_faces = [];
			if(indices)
			{
				for ( i = 0, l = indices.count; i < l; i += 3 ) {
					/*for( m = 0; m < 3; m ++ ){
						j = indices.getX( i + m ) + 1;

						face[ m ] = ( indexVertex + j ) + '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + '/' + ( indexNormals + j );

					}*/

					mesh_faces.push({
						mNumIndices : 3,
						mIndices: [
							indices.getX( i + 0 ) + 0, 
							indices.getX( i + 1 ) + 0,
							indices.getX( i + 2 ) + 0]
					});
				}
			}else{
				for (var i = 0, l = mesh.attributes.position.count; i < l; i += 3 ) 
				{
					mesh_faces.push({
						mNumIndices : 3,
						mIndices: [i, i + 1, i + 2]
					});
				}
			}
		}

		for( var a = 0; a < mesh_faces.length; ++a )
		{
			if (mesh_faces[a].mNumIndices == 2) countLines++;
			else if (mesh_faces[a].mNumIndices >= 3) countPoly++;
		}
			
		// lines
		if (countLines > 0)
		{
			this.mOutput += this.startstr + "<lines count=\"" + countLines + "\" material=\"defaultMaterial\">" + this.endstr;
			this.PushTag();
			this.mOutput += this.startstr + "<input offset=\"0\" semantic=\"VERTEX\" source=\"#" + idstrEscaped + "-vertices\" />" + this.endstr;
			this.mOutput += this.startstr + "<p>";
			for( var a = 0; a < mesh_faces.length; ++a )
			{
				var face = mesh_faces[a];
				if (face.mNumIndices != 2) continue;
				for( var b = 0; b < face.mNumIndices; ++b )
					this.mOutput += face.mIndices[b] + " ";
			}
			this.mOutput += "</p>" + this.endstr;
			this.PopTag();
			this.mOutput += this.startstr + "</lines>" + this.endstr;
		}

		// triangle - don't use it, because compatibility problems

		// polygons
		if (countPoly > 0)
		{
			this.mOutput += this.startstr + "<polylist count=\"" + countPoly + "\" material=\"defaultMaterial\">" + this.endstr;
			this.PushTag();
			this.mOutput += this.startstr + "<input offset=\"0\" semantic=\"VERTEX\" source=\"#" + idstrEscaped + "-vertices\" />" + this.endstr;
			for( var a = 0; a < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++a )
			{
				// TODO
				//if( mesh.HasTextureCoords((a) ) )
				//    this.mOutput += this.startstr + "<input offset=\"0\" semantic=\"TEXCOORD\" source=\"#" + idstrEscaped + "-tex" + a + "\" set=\"" + a + "\" />" + this.endstr;
			}

			this.mOutput += this.startstr + "<vcount>";
			for( var a = 0; a < mesh_faces.length; ++a )
			{
				if (mesh_faces[a].mNumIndices < 3) continue;
				this.mOutput += mesh_faces[a].mNumIndices + " ";
			}
			this.mOutput += "</vcount>" + this.endstr;

			this.mOutput += this.startstr + "<p>";
			for( var a = 0; a < mesh_faces.length; ++a )
			{
				var face = mesh_faces[a];
				if (face.mNumIndices < 3) continue;
				for( var b = 0; b < face.mNumIndices; ++b )
					this.mOutput += face.mIndices[b] + " ";
			}
			this.mOutput += "</p>" + this.endstr;
			this.PopTag();
			this.mOutput += this.startstr + "</polylist>" + this.endstr;
		}

		// closing tags
		this.PopTag();
		this.mOutput += this.startstr + "</mesh>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</geometry>" + this.endstr;
	},

	// ------------------------------------------------------------------------------------------------
	// Writes a float array of the given type
	WriteFloatArray: function( pIdString, pType, pData, pElementCount)
	{
		var floatsPerElement = 0;
		switch( pType )
		{
			case FloatType_Vector: floatsPerElement = 3; break;
			case FloatType_TexCoord2: floatsPerElement = 2; break;
			case FloatType_TexCoord3: floatsPerElement = 3; break;
			case FloatType_Color: floatsPerElement = 3; break;
			default:
				return;
		}

		var arrayId = pIdString + "-array";

		this.mOutput += this.startstr + "<source id=\"" + XMLEscape(pIdString) + "\" name=\"" + XMLEscape(pIdString) + "\">" + this.endstr;
		this.PushTag();

		// source array
		this.mOutput += this.startstr + "<float_array id=\"" + XMLEscape(arrayId) + "\" count=\"" + pElementCount * floatsPerElement + "\"> ";
		this.PushTag();

		if( pType == FloatType_TexCoord2 )
		{
			for( var a = 0; a < pElementCount; ++a )
			{
				this.mOutput += pData[a*3+0] + " ";
				this.mOutput += pData[a*3+1] + " ";
			}
		}
		else if( pType == FloatType_Color )
		{
			for( var a = 0; a < pElementCount; ++a )
			{
				this.mOutput += pData[a*4+0] + " ";
				this.mOutput += pData[a*4+1] + " ";
				this.mOutput += pData[a*4+2] + " ";
			}
		}
		else
		{
			for( var a = 0; a < pElementCount * floatsPerElement; ++a )
				this.mOutput += pData[a] + " ";
		}
		this.mOutput += "</float_array>" + this.endstr;
		this.PopTag();

		// the usual Collada fun. Let's bloat it even more!
		this.mOutput += this.startstr + "<technique_common>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<accessor count=\"" + pElementCount + "\" offset=\"0\" source=\"#" + arrayId + "\" stride=\"" + floatsPerElement + "\">" + this.endstr;
		this.PushTag();

		switch( pType )
		{
			case FloatType_Vector:
				this.mOutput += this.startstr + "<param name=\"X\" type=\"float\" />" + this.endstr;
				this.mOutput += this.startstr + "<param name=\"Y\" type=\"float\" />" + this.endstr;
				this.mOutput += this.startstr + "<param name=\"Z\" type=\"float\" />" + this.endstr;
				break;

			case FloatType_TexCoord2:
				this.mOutput += this.startstr + "<param name=\"S\" type=\"float\" />" + this.endstr;
				this.mOutput += this.startstr + "<param name=\"T\" type=\"float\" />" + this.endstr;
				break;

			case FloatType_TexCoord3:
				this.mOutput += this.startstr + "<param name=\"S\" type=\"float\" />" + this.endstr;
				this.mOutput += this.startstr + "<param name=\"T\" type=\"float\" />" + this.endstr;
				this.mOutput += this.startstr + "<param name=\"P\" type=\"float\" />" + this.endstr;
				break;

			case FloatType_Color:
				this.mOutput += this.startstr + "<param name=\"R\" type=\"float\" />" + this.endstr;
				this.mOutput += this.startstr + "<param name=\"G\" type=\"float\" />" + this.endstr;
				this.mOutput += this.startstr + "<param name=\"B\" type=\"float\" />" + this.endstr;
				break;
		}

		this.PopTag();
		this.mOutput += this.startstr + "</accessor>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</technique_common>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</source>" + this.endstr;
	},

	// ------------------------------------------------------------------------------------------------
	// Writes the scene library
	WriteSceneLibrary: function()
	{
		var scene_name_escaped = XMLEscape(this.mScene.name);

		this.mOutput += this.startstr + "<library_visual_scenes>" + this.endstr;
		this.PushTag();
		this.mOutput += this.startstr + "<visual_scene id=\"" + scene_name_escaped + "\" name=\"" + scene_name_escaped + "\">" + this.endstr;
		this.PushTag();

		// start recursive write at the root node
		for( var a = 0; a < this.mScene.children.length; ++a )
			this.WriteNode( this.mScene, this.mScene.children[a]);

		this.PopTag();
		this.mOutput += this.startstr + "</visual_scene>" + this.endstr;
		this.PopTag();
		this.mOutput += this.startstr + "</library_visual_scenes>" + this.endstr;
	},

	// ------------------------------------------------------------------------------------------------
	// Helper to find a bone by name in the scene
	//aiBone* 
	findBone: function( scene, name) {
		var num = this.collectedGeoms.length;
		for (var m=0; m<num; m++) {
			var mesh = this.collectedGeoms[m];
			for (var b=0; b<mesh.mNumBones; b++) { // TODO
				var bone = mesh.mBones[b];
				if (0 == strcmp(name, bone.mName)) {
					return bone;
				}
			}
		}
		return null;
	},

	// ------------------------------------------------------------------------------------------------
	// Recursively writes the given node
	WriteNode: function( pScene, pNode)
	{
		// the node must have a name
		if (pNode.name.length == 0)
		{
			var ss = "Node_" + pNode;
			pNode.name = (ss);
		}

		// If the node is associated with a bone, it is a joint node (JOINT)
		// otherwise it is a normal node (NODE)
		var node_type;
		if (null == this.findBone(pScene, pNode.name)) {
			node_type = "NODE";
		} else {
			node_type = "JOINT";
		}

		var node_name_escaped = XMLEscape(pNode.name);
		this.mOutput += this.startstr
				+ "<node id=\"" + node_name_escaped
				+ "\" name=\"" + node_name_escaped
				+ "\" type=\"" + node_type
				+ "\">" + this.endstr;
		this.PushTag();

		// write transformation - we can directly put the matrix there
		// TODO: (thom) decompose into scale - rot - quad to allow addressing it by animations afterwards
		var mat = pNode.matrix;
		this.mOutput += this.startstr + "<matrix>";
		this.mOutput += mat.elements[ 0] + " " + mat.elements[ 4] + " " + mat.elements[ 8] + " " + mat.elements[12] + " ";
		this.mOutput += mat.elements[ 1] + " " + mat.elements[ 5] + " " + mat.elements[ 9] + " " + mat.elements[13] + " ";
		this.mOutput += mat.elements[ 2] + " " + mat.elements[ 6] + " " + mat.elements[10] + " " + mat.elements[14] + " ";
		this.mOutput += mat.elements[ 3] + " " + mat.elements[ 7] + " " + mat.elements[11] + " " + mat.elements[15];
		this.mOutput += "</matrix>" + this.endstr;


		// this.collectedGeoms 
		var collectedNodeMeshes = [];
		pNode.traverse( function ( object ) {
			if ( object instanceof THREE.Mesh ) {
				if(object.geometry)
					collectedNodeMeshes.push(object.geometry);
			}
		}.bind(this));

		if(collectedNodeMeshes.length==0){
			//check if it is a camera node
			//for(var i=0; i<this.mScene.mNumCameras; i++){  editor.camera
			//    if(this.mScene.mCameras[i].mName == pNode.mName){
					this.mOutput += this.startstr +"<instance_camera url=\"#" + node_name_escaped + "-camera\"/>" + this.endstr;
			//        break;
			//    }
			//}
			//check if it is a light node
			/*for(var i=0; i<this.mScene.mNumLights; i++){
				if(this.mScene.mLights[i].mName == pNode.mName){
					this.mOutput += this.startstr +"<instance_light url=\"#" + node_name_escaped + "-light\"/>" + this.endstr;
					break;
				}
			}*/

		}else
		{
				
			var sceneMaterials = [];
			this.mScene.traverse( function ( object ) {
			if ( object instanceof THREE.Mesh )
			{
				//console.log(object);
				if(object.material)
					sceneMaterials.push(object.material);
			}
			}.bind(this));
			
			// instance every geometry
			for( var a = 0; a < collectedNodeMeshes.length; ++a )
			{
				var idNum = -1;
				for (var i = 0, l = this.collectedGeoms.length; i < l; i += 1 ) {
					if(this.collectedGeoms[i].uuid == collectedNodeMeshes[a].uuid) {
						idNum = i;
						break;
					}
				}
				var mesh = collectedNodeMeshes[a];
				// do not instanciate mesh if empty. I wonder how this could happen
				if(!mesh) // || mesh.mNumFaces == 0 || mesh.mNumVertices == 0 )
					continue;
				this.mOutput += this.startstr + "<instance_geometry url=\"#" + XMLEscape(this.GetMeshId( idNum)) + "\">" + this.endstr;
				this.PushTag();
				this.mOutput += this.startstr + "<bind_material>" + this.endstr;
				this.PushTag();
				this.mOutput += this.startstr + "<technique_common>" + this.endstr;
				this.PushTag();
				if(mesh.material){
					this.mOutput += this.startstr + "<instance_material symbol=\"defaultMaterial\" target=\"#" + XMLEscape(mesh.material.name) + "\">" + this.endstr;
					this.PushTag();
					/*for( var a = 0; a < AI_MAX_NUMBER_OF_TEXTURECOORDS; ++a )
					{
						if( mesh.HasTextureCoords( (a) ) )
							// semantic       as in <texture texcoord=...>
							// input_semantic as in <input semantic=...>
							// input_set      as in <input set=...>
							this.mOutput += this.startstr + "<bind_vertex_input semantic=\"CHANNEL" + a + "\" input_semantic=\"TEXCOORD\" input_set=\"" + a + "\"/>" + this.endstr;
					}*/
					this.PopTag();
					this.mOutput += this.startstr + "</instance_material>" + this.endstr;
				}
				this.PopTag();
				this.mOutput += this.startstr + "</technique_common>" + this.endstr;
				this.PopTag();
				this.mOutput += this.startstr + "</bind_material>" + this.endstr;
				this.PopTag();
				this.mOutput += this.startstr + "</instance_geometry>" + this.endstr;
			}
		}

		// recurse into subnodes
		for( var a = 0; a < pNode.children.length; ++a )
			this.WriteNode( pScene, pNode.children[a]);

		this.PopTag();
		this.mOutput += this.startstr + "</node>" + this.endstr;
	}

	}

	// END Inline parser object




		console.log("DAESceneExporter parse "+pScene);

		// invoke the exporter
		var iDoTheExportThing = new ColladaExporter();
		iDoTheExportThing.mScene = pScene;
		iDoTheExportThing.WriteFile();
		return iDoTheExportThing.mOutput;
		
	},





};
