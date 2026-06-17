# UDP-Serial ソレノイド・ルーター (UDP Serial Solenoid Router)

本プロジェクトは、UDP を介して受信した信号をシリアル通信（Serial）にルーティングし、Arduinoに接続されたソレノイドを制御するためのシステムです。
主に、Node.jsで書かれた送信側（`sender`）と、RustおよびArduinoで構成された受信側（`arduino-receiver`）の2つのコンポーネントから構成されています。

## プロジェクト構成

```
.
├── README.md                  # 本ドキュメント
├── arduino-receiver/          # 受信機およびシリアルルーティング (Rust & Arduino)
│   ├── keyboard-solenoid.ino  # Arduino用スケッチ
│   ├── run.sh                 # コンパイル・アップロード・起動用の自動化スクリプト
│   ├── Cargo.toml             # Rustプロジェクト設定
│   └── src/
│       └── main.rs            # UDP受信およびシリアル送信を行うRustメインソース
└── sender/                    # 送信機 (Node.js)
    ├── app.js                 # テスト用OSCパケット送信プログラム
    └── package.json           # Node.js依存関係定義
```

---

## 各コンポーネント詳細

### 1. Arduino レシーバ・スケッチ (`arduino-receiver/keyboard-solenoid.ino`)
* **役割**:
  PC（Rustプログラム）からシリアル通信経由で送られてくる制御コマンドを受け取り、指定されたピンをデジタル出力制御します。
* **動作詳細**:
  * ボーレート `115200` でシリアルポートを監視します。
  * 受信データが `'1'` の場合、`pin 6` を `HIGH` にします（ソレノイドをONにする）。
  * 受信データが `'0'` の場合、`pin 6` を `LOW` にします（ソレノイドをOFFにする）。
* **使用するハードウェア**: Arduino Unoなど（出力ピン: `6`）

### 2. Rust ルーティング・サーバー (`arduino-receiver/src/main.rs`)
* **役割**:
  UDPポート `54736` を監視し、何らかのパケットを受信すると、シリアル通信を介してArduinoへパケットを転送（ルーティング）します。
* **動作詳細**:
  * 指定したシリアルポート（デフォルトは `/dev/ttyACM0`、ボーレート `115200`）を開きます。
  * UDPソケットを `0.0.0.0:54736` にバインドして待機します。
  * パケットを受信すると、中身に関わらずArduinoへ `"1"` を送信し、50ミリ秒待機（スリープ）した後に `"0"` を送信します。これにより、ソレノイドが50ms間だけ駆動するパルス信号が生成されます。

### 3. Node.js 送信デモ用プログラム (`sender/app.js`)
* **役割**:
  ユーザーがキーボード入力を行うことで、トリガーとなるOSC（Open Sound Control）風のUDPパケットを送信します。
* **動作詳細**:
  * UDPポート `54736` に対し、パケット（`/solenoid/on` というOSCアドレスパターンのバイナリ表現）を送信します。
  * コンソールで `[ENTER]` キーを押すたびに、設定されたターゲットIP（デフォルトは `0.0.0.0`）にパケットを送信します。
  * また、自身もポート `54736` でUDPパケットを監視しており、パケットを受け取ると受信ログを出力します。

---

## 必要要件とセットアップ

本プロジェクトを実行するには、以下のツールがインストールされている必要があります。

1. **Rustツールチェーン** (rustc, cargo) - Rustプログラムのビルド・実行用
2. **Node.js** - 送信テストスクリプトの実行用
3. **Arduino CLI** (`arduino-cli`) - スケッチのコンパイルとArduinoへのアップロード用
   * スケッチのビルドには FQBN: `arduino:avr:uno` を使用します。
4. **Arduino Uno**（または互換機）
   * デバイスのパスが `/dev/ttyACM0` であることを前提としています。環境に応じて適宜変更してください。

---

## ファイアウォールの設定とポート開放

本プロジェクトでは UDP 通信（デフォルトポート: `54736`）を使用します。ネットワーク経由で他のマシンやデバイスからパケットを受け取る場合、または OS のデフォルトのセキュリティ設定によって通信がブロックされる場合は、ファイアウォールでこのポートを開放する必要があります。

### Linux (ufw の場合)
`ufw` を使用している Linux システムでは、以下のコマンドを実行して UDP ポート `54736` を許可してください。

```bash
sudo ufw allow 54736/udp
sudo ufw reload
```

状態を確認するには以下を実行します。
```bash
sudo ufw status
```

### macOS
macOS の標準ファイアウォールを使用している場合：
1. **システム設定（GUI）**:
   * 「システム設定」 > 「ネットワーク」 > 「ファイアウォール」に移動します。
   * ファイアウォールが有効な場合、「オプション...」を開き、Rust サーバーバイナリなどの受信接続を許可するか、すべての受信接続をブロックするオプションがオフになっていることを確認します。
2. **コマンドライン（PF: Packet Filter）**:
   * `/etc/pf.conf` に以下のルールを追加し、設定を適用します。
     ```text
     pass in proto udp from any to any port 54736
     ```
   * 設定を反映してPFを有効化します：
     ```bash
     sudo pfctl -f /etc/pf.conf
     sudo pfctl -e
     ```

### Windows
Windows Defender ファイアウォールで UDP ポート `54736` の受信接続を許可します：
1. **PowerShell（管理者として実行）**:
   ```powershell
   New-NetFirewallRule -DisplayName "Arduino UDP Solenoid Router" -Direction Inbound -Action Allow -Protocol UDP -LocalPort 54736
   ```
2. **コマンドプロンプト（管理者として実行）**:
   ```cmd
   netsh advfirewall firewall add rule name="Arduino UDP Solenoid Router" dir=in action=allow protocol=UDP localport=54736
   ```
3. **GUI（グラフィカルユーザーインターフェース）**:
   * 「コントロールパネル」 > 「システムとセキュリティ」 > 「Windows Defender ファイアウォール」 > 「詳細設定」を開きます。
   * 「受信の規則」をクリックし、右側の「新しい規則...」を選択します。
   * 規則の種類に「ポート」を指定し、プロトコルに「UDP」、特定のローカルポートに `54736` を指定して、「接続を許可する」を選択して保存します。

---
## 起動・使用方法

### ステップ 1: ArduinoとPCの接続
Arduino UnoをPCに接続し、接続されているシリアルポートを確認します。ポートが `/dev/ttyACM0` でない場合は、以下のファイルを書き換えてください：
* [arduino-receiver/src/main.rs](file:///home/yutaro/sfc-s2026/diy-electronics/week9/arduino-receiver/src/main.rs) の `port_name` 変数（9行目付近）
* [arduino-receiver/run.sh](file:///home/yutaro/sfc-s2026/diy-electronics/week9/arduino-receiver/run.sh) のアップロード先ポート（4行目付近）

### ステップ 2: 受信サーバーの起動 (Rust & Arduino)
[arduino-receiver](file:///home/yutaro/sfc-s2026/diy-electronics/week9/arduino-receiver) ディレクトリで、提供されているシェルスクリプトを実行します。これにより、Arduinoへのスケッチの書き込みとRustサーバーの起動が自動で行われます。

```bash
cd arduino-receiver
bash run.sh
```

> [!NOTE]
> スクリプトは内部で `arduino-cli compile` および `arduino-cli upload` を実行し、その後 `cargo run` を呼び出します。

### ステップ 3: 送信クライアントの起動 (Node.js)
別のターミナルを開き、[sender](file:///home/yutaro/sfc-s2026/diy-electronics/week9/sender) ディレクトリからNode.jsスクリプトを起動します。

```bash
cd sender
node app.js
```

### ステップ 4: 動作確認
送信クライアントのターミナルで `[ENTER]` キーを押します。
1. `sender/app.js` から UDPパケットが `0.0.0.0:54736` へ送信されます。
2. `arduino-receiver`（Rust）がパケットを受信し、シリアルポート経由で Arduino に `"1"` を送信し、50ms後に `"0"` を送信します。
3. Arduino の `pin 6` が50msの間 `HIGH` になり、接続されたソレノイドが動作します。
