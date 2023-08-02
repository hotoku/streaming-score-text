# todo

## fastapiとreactでwebsockets通信

- [x] fastapiでシンプルにindex.htmlを返す
- [x] fastapiでwebsocketsのechoサーバーを実装
- [x] reactでechoクライアントを実装

## スコアAPIに通信を開ける

- [x] nginx入れる
- [x] nginx起動
- [x] :80/msgをAPIに転送

## サーバーからの受信を一時停止したい

- [ ] クライアント→サーバーにstop/startメッセージを送れるようにする
- [ ] サーバー側にメッセージを受け取るループを置く必要がある
- [ ] メッセージを受け取るループとは別にメッセージを送り続けるループが必要
- [ ] メッセージを受け取るループとメッセージを送るループの間でstop/startのシグナルを授受する必要がある
