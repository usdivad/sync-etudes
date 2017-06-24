// Variables used throughout the preload/create/update/render functions
var game = new Phaser.Game(800, 600, Phaser.AUTO, "game", {
    "preload": preload,
    "create": create,
    "update": update,
    "render": render
});

var circle;
var sprite;
var activeInputPreviouslyDown = false;

// Preload/create/update/render functions
function preload() {
    // game.load.image("name", "path");
}

function create() {
    // Setup game
    game.stage.backgroundColor = "rgba(0, 0, 0, 1)";
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Draw cirlce
    circle = game.add.graphics(0, 0);
    // circle = new Phaser.Graphics(game, 0, 0);
    // circle.beginFill("rgba(150, 150, 150, 1)");
    circle.beginFill(0x888888, 1);
    circle.drawCircle(0, 0, 50);

    // Create sprite from circle
    sprite = game.add.sprite(game.world.centerX, game.world.centerY);
    sprite.addChild(circle);
    sprite.anchor.set(0.5);
    game.physics.arcade.enable(sprite);
}

function update() {
    // Accelerate towards the pointer if pointer down, otherwise decelerate
    if (game.physics.arcade.distanceToPointer(sprite, game.input.activePointer) > 50
        && game.input.activePointer.isDown) {
        game.physics.arcade.accelerateToPointer(sprite, game.input.activePointer, 240);
        // game.physics.arcade.moveToPointer(sprite, 240, game.input.activePointer, 500);
    }
    else {
        // sprite.body.acceleration.set(0);

        var spriteX = sprite.body.velocity.getMagnitude() == 0 ? 0 : sprite.body.velocity.x * 0.8;
        var spriteY = sprite.body.velocity.getMagnitude() == 0 ? 0 : sprite.body.velocity.y * 0.8;
        sprite.body.velocity.set(spriteX, spriteY);

        // sprite.body.velocity.set(0);
    }


    if (game.input.activePointer.isDown) {
        // sprite.tint = 0xAAAAAA;
        if (!activeInputPreviouslyDown) {
            circle.clear();
            circle.beginFill(0xCCCCCC, 1);
            circle.drawCircle(0, 0, 55);
        }
        activeInputPreviouslyDown = true;
    }
    else {
        // sprite.tint = 0x888888;
        if (activeInputPreviouslyDown) {
            circle.clear();
            circle.beginFill(0x888888, 1);
            circle.drawCircle(0, 0, 50);
        }
        activeInputPreviouslyDown = false;
    }
}

function render() {
    // game.debug.geom(circle, "rgba(150, 150, 150, 1)");
    // game.debug.pointer(game.input.activePointer);
}