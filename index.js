const path = require('path'); //node에 자동으로 들어간거라 설치안함
const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
//mongodb 관련 모듈
const MongoClient = require('mongodb').MongoClient;

let db = null;
MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true }, (err, client) => {
  console.log('연결');
  if (err) {
    console.log(err);
  }
  db = client.db('crudapp');
});

app.use(express.urlencoded({ extended: false })); //express에서 제공, post로 날아온 방식은 꼭 이걸써야 바디에서 받음 true나 false나 별차이없음
app.set('view engine', 'ejs'); //ejs는 views 폴더안에 있어야 동작한다.
app.get('/', (req, res) => {
  //res.send('hello node ya');
  res.render('index');
});
//req, res 정의 다시.
//page를 건네주어야 한다. ../ 이게 아닌 절대경로로.
//리눅스경로를 알아야 할 필요가 있다. 경로에 중요한게 path
//원래는 폴더경로 + \ 로 바꿔줘야하나 이렇게쓴다
//__dirnam은 현재 내가 사용하고 있는 폴더까지의 경로다.
app.get('/write', (req, res) => {
  //res.sendFile(path.join(__dirname, 'public/html/write.html'));
  res.render('write');
});
app.post('/add', (req, res) => {
  db.collection('counter').findOne({ name: 'total' }, (err, result) => {
    const total = result.totalPost;
    //console.log('write에서 post로 보낸 data 받는곳'); //send까지 해야한다
    //데이터는 어떻게 받느냐. 폼태그의 name에 있는 값을 받는거다
    const subject = req.body.subject;
    const contents = req.body.contents;
    console.log(subject);
    console.log(contents);
    // insert delete update select 원래는 이렇게 sql로 써야하는데 몽고db에서는 메서드형태도 제공한다.
    const insertData = {
      no: total + 1,
      subject: subject,
      contents: contents,
    };
    db.collection('crud').insertOne(insertData, (err, result) => {
      db.collection('counter').updateOne({ name: 'total' }, { $inc: { totalPost: 1 } }, (err, result) => {
        if (err) {
          console.log(err);
        }
        res.send(`<script>alert("글이 입력되었습니다."); location.href="/list"</script>`);
      });
    });
  });
});
//$inc 하면 값을 1증가 시켜준다 이건 몽고디비에서 제공하는 함수다.

//1. db접속
//2. 데이터 밀어넣기
//res.send('잘도착했어요');
//res.sendFile(path.join(__dirname, 'public/result.html'));
//alert("글이 입력되었습니다.") 이건 안됨 노드라서(노드에는 브라우저가 없음 alert는 브라우저에서 쓰는 스크립트는가능)
//res는 한번만 된다. 아래거는 인식 x
//res.send가 html보내는거다
//res.redirect('/list');
//몽고디비는 해시태그로 데이터가 쌓이며 인덱싱기능이 없다. 순서정하기가 용이하지 않다
//포스트는 보낼때, get은 받은값을 뿌릴때. db에 밀어넣는거는 오브젝트로만 넣어야함
app.get('/list', (req, res) => {
  //crud에서 데이터 받아보기
  db.collection('crud')
    .find()
    .toArray((err, result) => {
      //toArray() 배열로 돌려줌
      console.log(result); //서버사이드 랜더링 ?
      //res.send(), res.sendFile(), res.json(result); // front가 알아서 처리해서 가져다 쓰기 (백엔드쪽에서 편한방법)
      res.render('list', { list: result, title: 'test용입니다.' }); // 페이지 내가 만들어서보내주기
    });
});
// app.get('/detail/id: detail', (req, res) => {
//   console.log(req.query.id);
//   res.render('detail');
// });
app.get('/detail/:no', (req, res) => {
  console.log(req.params.no);
  const no = parseInt(req.params.no); //get으로 넘어오면 문자처리되어서 다시 넘버(정수)로 바꿔줘야 비교가 된다
  db.collection('crud').findOne({ no: no }, (err, result) => {
    if (err) {
      console.log(err);
    }
    if (result) {
      console.log(result);
      res.render('detail', { subject: result.subject, contents: result.contents });
    }
  });
  //res.render('detail');
});

//port는 서버를 빌리는 곳에서 지정해주는 포트를 써야한다
app.listen(8099, () => {
  console.log('8099에서 서버 대기중');
});

//네이버에서 값을 받아올때는 무조건 포스트로 날려야한다
//주소창에서는 못날리니깐 반드시
//get방식으로 받는방법 query , params
// ? 로 보내는 방법 -> req.query.aaa
// params는 : 으로 받음

//post는 무조건 바디로 받는다. req.body.subject(html의 name 값이다 )
