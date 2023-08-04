# ストリームのリファクタ

- データソースから読む
- テキストをAPIに投げる
- 結果をyieldする

のを、別のworkerにして非同期で処理したい

```mermaid
sequenceDiagram
  Reader ->> RawTextQueue: await put, text
  Scorer ->> RawTextQueue: await get
  RawTextQueue ->> Scorer: text
  Scorer ->> API: HTTPリクエスト, text
  API ->> Scorer: レスポンス, text, score
  Scorer ->> ScoreQueue: await put, text, score
```

todo: RawTextQueueとScoreQueueで、終わったことは、どうやって検知するか考える

## 本番と開発用のポートなどの差異

※ ここの流れは、だいぶ変えたあとに編集してない。
同じ図が必要になった場合は、実装を確認して変更する必要がある。

本番

```mermaid
flowchart LR
  subgraph client
    browser
    tunnel1
  end

  subgraph GCP
    subgraph cloudrun
      api
    end
    subgraph bastion
      tunnel2
      nginx
      app
    end
  end
  browser -->|http://localhost:10080/| tunnel1
  browser -->|http,ws://localhost:10080/ws| tunnel1
  tunnel1 -->|ssh:22| tunnel2
  tunnel2 -->|http://localhost:80/| nginx
  tunnel2 -->|http,ws://localhost:80/ws| nginx
  nginx -->|https://run.app:443/msg| api
  nginx -->|http://localhost:8000/ws| app
  app -->|http://localhost:80/msg| nginx
```

開発

```mermaid
flowchart LR
  subgraph client
    browser
    npm
    tunnel1
    app
  end

  subgraph GCP
    subgraph cloudrun
      api
    end
    subgraph bastion
      tunnel2
      nginx
    end
  end

  browser -->|http://localhost:3000| npm
  browser -->|http,ws://localhost:8000/ws| app
  app -->|http://localhost:10080/msg| tunnel1
  tunnel1 -->|ssh:22| tunnel2
  tunnel2 -->|http://localhost:80/msg| nginx
  nginx -->|https://run.app:443/msg| api
```

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

- [x] クライアント→サーバーにstop/startメッセージを送れるようにする
- [x] サーバー側にメッセージを受け取るループを置く必要がある
- [x] メッセージを受け取るループとは別にメッセージを送り続けるループが必要
- [x] メッセージを受け取るループとメッセージを送るループの間でstop/startのシグナルを授受する必要がある
