const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/main.ts", //ファイルをまとめる際のエントリーポイント
  resolve: {
    extensions: [".ts"] //拡張子がtsだったらTypescirptでコンパイルする
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader" //ts-loader使うよ
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin()]
};
