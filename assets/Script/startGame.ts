const { ccclass, property } = cc._decorator;

import * as mathRandom from "../Script/random";
import tile from "../Script/tile";
import { ccTiles } from "../Script/ccTiles";
import steap from "../Script/steap";
import bar from "../Script/progressBar";
import propTiles from "../Script/propTiles";

@ccclass
export default class startGame extends cc.Component {
    @property(cc.Vec2)
    sizeBoard: cc.Vec2 = new cc.Vec2(5, 5);

    /* @property(ccTiles)
    public textureList: ccTiles[] = []; */

    @property(cc.Boolean)
    clickBlock: Boolean = false;

    @property(propTiles)
    propTiles: propTiles = null;

    mapTile = [];

    @property(steap)
    steap: steap = null;

    @property(bar)
    bar: bar = null;

    createBoard() {
        let sizeTile = this.propTiles.tilePrefab.data.getContentSize();
        for (let n = 0; n < this.sizeBoard.x; n++) {
            this.mapTile.push([]);
            for (let m = 0; m < this.sizeBoard.y; m++) {
                let pos = new cc.Vec2(sizeTile.height * m, sizeTile.width * -n);
                let tile = this.propTiles.newTile(pos);
                this.mapTile[n].push(tile);
            }
        }
    }
    _clickBlock(state: Boolean = null) {
        if (state != null) this.clickBlock = state;
        return this.clickBlock;
    }
    genTileInEmpty() {
        let sizeTile = this.propTiles.tilePrefab.data.getContentSize();

        for (let n = 0; n < this.sizeBoard.x; n++) {
            for (let m = 0; m < this.sizeBoard.y; m++) {
                let checkTile: cc.Node = this.mapTile[n][m];
                if (!checkTile.active) {
                    let pos = new cc.Vec2(
                        sizeTile.height * m,
                        sizeTile.width * 3
                    );
                    let posMove = new cc.Vec2(
                        sizeTile.height * m,
                        sizeTile.width * -n
                    );
                    let tile = this.propTiles.newTile(pos, posMove);
                    this.mapTile[n][m] = tile;
                }
            }
        }
    }

    xMarkTiles(tile: cc.Node) {
        let pos = this.findTile(tile);
        let row = this.checkInRow(tile, pos);
        let col = this.checkInCol(tile, pos);
        let stackTile = [...row, ...col];
        return stackTile;
    }
    comboTile(tile: cc.Node) {
        let stackTile = this.xMarkTiles(tile);
        if (stackTile.length == 0) return false;
        let stackRemove = [];
        stackRemove.push(tile);

        while (stackTile.length > 0) {
            let nextTile = stackTile.shift();
            let xTiles = this.xMarkTiles(nextTile);
            xTiles.forEach((xTile) => {
                let inRem = false;
                let inStack = false;
                stackRemove.forEach((elRem) => {
                    if (elRem._id == xTile._id) inRem = true;
                });

                stackTile.forEach((elRem) => {
                    if (elRem._id == xTile._id) inStack = true;
                });

                if (!inRem && !inStack) {
                    stackTile.push(xTile);
                }
            });
            stackRemove.push(nextTile);
        }

        stackRemove.forEach((e: cc.Node) => {
            let tileComp: tile = e.getComponent("tile");
            tileComp._setPositionActionRemove(tile.position);
        });
        return true;
    }

    clickTile(tile: cc.Node) {
        let combo = this.comboTile(tile);
        this._clickBlock(combo);
        if (combo) {
            this.steap.set();
            this.bar.updateBar();

            setTimeout(() => {
                this.gravityTiles();
            }, 600);

            setTimeout(() => {
                this.genTileInEmpty();
            }, 1000);

            setTimeout(() => {
                this._clickBlock(false);
            }, 1100);
        }
    }

    gravityTiles() {
        for (let n = 0; n < this.sizeBoard.x - 1; n++) {
            let posToGrav = null;

            for (let m = this.sizeBoard.y; m >= 0; m--) {
                let tile: cc.Node = this.mapTile[m][n];

                if (!tile.active && !posToGrav) {
                    posToGrav = m;
                    continue;
                }

                if (tile.active && posToGrav) {
                    /* if (this.mapTile[m - 1]) {
                        let top: cc.Node = this.mapTile[m - 1][n];
                        if (!top.active) {
                            continue;
                        }
                    } */

                    let move: cc.Node = this.mapTile[m][n];
                    let newpos = new cc.Vec2(
                        move.height * n,
                        move.width * (-1 * posToGrav)
                    );
                    let tileMove: tile = move.getComponent("tile");
                    tileMove._setPositionAction(newpos);

                    this.mapTile[posToGrav--][n] = this.mapTile[m][n];
                    this.mapTile[m][n] = cc.Node;
                }
            }
        }
    }

    checkTileInBoard(tile, pos) {
        let x = pos[0];
        let y = pos[1];
        if (this.mapTile[x] == null) {
            return false;
        }
        if (this.mapTile[x][y] == null) {
            return false;
        }
        return tile;
    }

    chechColor(selectTile: cc.Node, matchTile: cc.Node) {
        const firstTileColor: string = selectTile.getComponent("tile").color;
        const secondTileColor: string = matchTile.getComponent("tile").color;
        return firstTileColor == secondTileColor;
    }

    checkInRow(tile: cc.Node, pos) {
        let x = pos[0];
        let y = pos[1] + 1;
        let tilesInRow = [];

        let inBoard = this.checkTileInBoard(tile, [x, y]);
        if (inBoard) {
            const nextTile: cc.Node = this.mapTile[x][y];
            const nextTileColor: tile = nextTile.getComponent("tile").color;
            /* console.log("row right: " + nextTileColor); */

            if (this.chechColor(tile, nextTile)) {
                tilesInRow.push(nextTile);
            }
        } else {
            /* console.log("row right: " + "not found"); */
        }

        y = pos[1] - 1;
        inBoard = this.checkTileInBoard(tile, [x, y]);
        if (inBoard) {
            const nextTile: cc.Node = this.mapTile[x][y];
            const nextTileColor: tile = nextTile.getComponent("tile").color;
            /* console.log("row left: " + nextTileColor); */
            if (this.chechColor(tile, nextTile)) {
                tilesInRow.push(nextTile);
            }
        } else {
            /* console.log("row left: " + "not found"); */
        }
        return tilesInRow;
    }
    checkInCol(tile: cc.Node, pos) {
        let x = pos[0] + 1;
        let y = pos[1];
        let tilesInCol = [];

        let inBoard = this.checkTileInBoard(tile, [x, y]);
        if (inBoard) {
            const nextTile: cc.Node = this.mapTile[x][y];
            const nextTileColor: tile = nextTile.getComponent("tile").color;
            /*  console.log("col bottom: " + nextTileColor); */
            if (this.chechColor(tile, nextTile)) {
                tilesInCol.push(nextTile);
            }
        } else {
            /* console.log("col bottom: " + "not found"); */
        }

        x = pos[0] - 1;
        inBoard = this.checkTileInBoard(tile, [x, y]);
        if (inBoard) {
            const nextTile: cc.Node = this.mapTile[x][y];
            const nextTileColor: tile = nextTile.getComponent("tile").color;
            /* console.log("col top: " + nextTileColor); */
            if (this.chechColor(tile, nextTile)) {
                tilesInCol.push(nextTile);
            }
        } else {
            /* console.log("col top: " + "not found"); */
        }
        return tilesInCol;
    }

    findTile(findTile: cc.Node) {
        for (let n = 0; n < this.sizeBoard.x; n++) {
            for (let m = 0; m < this.sizeBoard.y; m++) {
                if (this.mapTile[n][m] == findTile) {
                    return [n, m];
                }
            }
        }
    }

    onLoad() {
        this.propTiles = this.node.getComponent("propTiles");
        this.steap = this.node.getComponent("steap");
        this.bar = this.node.getComponent("progressBar");
        this.createBoard();
    }

    start() {}

    update(dt) {}
}
