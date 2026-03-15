// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "YamaBruh",
    platforms: [.iOS(.v16), .macOS(.v13), .watchOS(.v9)],
    products: [
        .library(name: "YamaBruh", targets: ["YamaBruh"]),
    ],
    targets: [
        .target(name: "YamaBruh"),
        .testTarget(name: "YamaBruhTests", dependencies: ["YamaBruh"]),
    ]
)
