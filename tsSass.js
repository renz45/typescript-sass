var fs = require('fs')
var path = require('path')
var sass = require('node-sass')
var glob = require("glob")
var importDeps = {}

var options = JSON.parse(fs.readFileSync(path.resolve('./tsSassConfig.json'), 'utf8'));
var sassDir = options && options.sassDir //"app"
var sassSubDir = options && options.sassSubDir //"sass"

glob(sassDir + "/**/*.sass", {dot: true}, function (er, files) {
  var l = files.length
  for(var i=0; i < l; i++){
    var sassFile = files[i]
    console.log("initial compile: " + sassFile)
    compileSassFile(sassFile)
  }
})

var updateDeps = function(sassResult) {
  var parentFile = sassResult.stats.entry
  var l = sassResult.stats.includedFiles.length

  for(var i=0; i < l; i++){
    var depFile = sassResult.stats.includedFiles[i]

    if(depFile != parentFile) {
      if(!importDeps[depFile]){
        importDeps[depFile] = []
      }

      if(importDeps[depFile].indexOf(parentFile) === -1) {
        importDeps[depFile].unshift(parentFile)
      }
    }
  }
}

var compileParents = function(sassResult) {
  var parents = importDeps[sassResult.stats.entry]
  if(parents) {
    var l = parents.length
    for(var i=0; i < l; i++){
      var parent = parents[i]
      console.log("Compiling parent Sass File: " + parent)
      compileSassFile(parent, {skipParents: true})
    }
  }
}

var buildModuleFile = function(css) {
  return [
    'export default `',
    css,
    '`'
  ].join("\n")
}

var handleSassSubDir = function(fileName){
  splitPath = fileName.split(path.sep)
  if(splitPath[splitPath.length - 2] === sassSubDir){
    splitPath.splice(splitPath.length - 2, 1)
    return path.sep + path.join.apply(this, splitPath)
  }else{
    return fileName
  }
}

var compileSassFile = function(fileName, options) {
  var baseDir = options && options.baseDir
  var skipParents = options && options.skipParents
  var filePath
  var includePaths = [path.resolve(path.dirname(fileName)), path.resolve(sassDir)]

  if(baseDir) {
    filePath = path.join(baseDir, fileName)
  }else{
    filePath = fileName
  }

  sass.render({file: path.resolve(filePath), includePaths: includePaths}, function(err, result) {
    var newFileName

    if(err) {
      console.log(err)
      return
    }
    
    if(baseDir){
      newFileName = path.resolve(baseDir + "/" + fileName)
    }else{
      newFileName = path.resolve(fileName)
    }

    var moduleFile = buildModuleFile(result.css)
    newFileName = newFileName.replace(/(\.sass|.scss)/, ".ts")

    newFileName = handleSassSubDir(newFileName)
    updateDeps(result)

    var dirname = path.dirname(newFileName)
    fs.mkdir(dirname, function(){
      fs.writeFile(newFileName, moduleFile)
      if(!skipParents){
        compileParents(result)
      }
    });
  });
}

fs.watch(sassDir, {recursive: true}, function (event, fileName) {
  if (fileName.match(/(\.sass|\.scss)$/)) {
    console.log("Compiling Sass File: " + fileName)
    compileSassFile(fileName, {baseDir: sassDir})
  }
});
