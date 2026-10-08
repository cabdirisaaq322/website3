const path = require('path');
const { app, upload, nanoid } = require('./base');
require('./routes-public')(app, nanoid);
require('./routes-admin')(app, upload);

app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'admin.html')));
app.get('/admin.html',(req,res)=>res.sendFile(path.join(__dirname,'admin.html')));
app.get('/app/:slug',(req,res)=>res.sendFile(path.join(__dirname,'app.html')));
app.get('/category/:slug',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/app.html',(req,res)=>res.sendFile(path.join(__dirname,'app.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Store running http://localhost:${PORT} admin /admin.html use ADMIN_KEY`));
