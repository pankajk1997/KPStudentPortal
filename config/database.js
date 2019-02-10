if(process.env.NODE_ENV === 'production'){
    module.exports = {mongoURI: 'mongodb://admin:qazPLM123.!@ds129085.mlab.com:29085/cdackp'}
} else {
    module.exports = {mongoURI: 'mongodb://admin:password@localhost/cdackp?authSource=admin&w=1'}
}