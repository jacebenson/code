var url = new URL(window.location.href);
var id = parseInt(url.searchParams.get("id"),10) || 0;
console.log('id',id);
var client = stitch.Stitch.initializeDefaultAppClient('code-lxkgy');
var db = client.getServiceClient(stitch.RemoteMongoClient.factory, 'mongodb-code').db('code');
  
function initUser(name) {
    client.auth.loginWithCredential(new stitch.AnonymousCredential()).then(user =>
        db.collection('users').updateOne({ owner_id: client.auth.user.id }, { $set: { name: name, document: id } }, { upsert: true })
    ).then(() => 
        //db.collection('users').find({ document: id }).asArray()
        db.collection('users').find({}).asArray()
    ).then(users => {
        console.log('Users', users.length);
        window.user = users[0];
        jQuery('#myName').val(user.name);
        var simpleList = users.map(function(user){
            return user.name;
        });
        jQuery('#editor-ln1').text(simpleList);
        console.log("Found docs", users)
        console.log("[MongoDB Stitch] Connected to Stitch")
    }).then(() =>
        db.collection('snippets').find({ document: id }).asArray()
    ).then(doc => {
        console.log(doc);
        jQuery('#code').val(doc[0].content);
    }).catch(err => {
        console.error(err)
    });
}

function updateSnippet(){
    var content = jQuery('#code').val()
    console.log('Content', content);
    client.auth.loginWithCredential(new stitch.AnonymousCredential()).then(() =>
        db.collection('snippets').updateOne({ document: id }, { $set : { document: id, content: content } }, {upsert: true})
    ).then(doc => {
        console.log(doc);
    }).catch(err => {
        console.error(err)
    });
}