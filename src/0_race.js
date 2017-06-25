// ---- Phaser variables ----
var game = new Phaser.Game(800, 600, Phaser.AUTO, "game", {
    "preload": preload,
    "create": create,
    "update": update,
    "render": render
});
var circle;
var sprite;
var activeInputPreviouslyDown = false;
var spriteVelMax = 120;

// ---- Tone.js variables ----
var synthP1 = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 1,
        "decay": 1,
        "sustain": 0.5,
        "release": 2
    }
}).toMaster();

var synthMetro = new Tone.Synth({
    "oscillator": {
        "type": "sine"
    },
    "envelope": {
        "attack": 0.1,
        "decay": 0.5,
        "sustain": 0.5,
        "release": 0.75
    }
}).toMaster();

var loop = new Tone.Loop(function(time) {
    // Play metronome
    synthMetro.triggerAttackRelease("C2", "8n", time);

    // Draw metronome
    Tone.Draw.schedule(function() {
        game.stage.backgroundColor = "rgba(50, 50, 50, 1)";
    }, time);
    Tone.Draw.schedule(function() {
        game.stage.backgroundColor = "rgba(0, 0, 0, 1)";
    }, "+8n");

    // Update beat variable
    currBeatTime = time;

    // Update velocity
    sprite.body.velocity.set(0);

    console.log("beat " + Tone.Transport.seconds);
}, "4n");

loop.start(0);

Tone.Transport.bpm.value = 60;
Tone.Transport.start(0);

// ---- Synchronization variables and functions ----
var currBeatTime = 0;

function calculateSyncDegree() {
    var clickTime = Tone.Transport.seconds;
    var timeDiff = Math.abs(clickTime - currBeatTime);
    var beatDuration = (60.0 / Tone.Transport.bpm.value) * (Tone.Transport.timeSignature / 4.0); // in seconds
    console.log("click: ", clickTime, "currBeat: ", currBeatTime);

    var syncRatio = (beatDuration - timeDiff) / beatDuration;
    // if (syncRatio > 0.5) {
    //     syncRatio = 0.49;
    // }
    // syncRatio = syncRatio * syncRatio; // Square it to make effects more prominent
    // syncRatio = syncRatio * 2; // Multiply by 2 to make it from 0-1

    syncDegree = syncRatio;
    syncDegree = Math.abs(0.5 - syncRatio); // Get distance from 0.5, the phase point that should be lowest scored
    syncDegree *= 2;
    // syncDegree = 1 - syncDegree;

    console.log("timeDiff=" + timeDiff + ", beatDur=" + beatDuration +   ", ratio=" + syncRatio + ", degree=" + syncDegree);
    return syncDegree;
}

// ---- Phaser preload/create/update/render functions ----
function preload() {
    // game.load.image("name", "path");
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
}

function create() {
    // Setup game
    game.stage.backgroundColor = "rgba(0, 0, 0, 1)";
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Draw circle
    circle = game.add.graphics(0, 0);
    // circle = new Phaser.Graphics(game, 0, 0);
    // circle.beginFill("rgba(150, 150, 150, 1)");
    circle.beginFill(0x888888, 1);
    circle.drawCircle(0, 0, 50);

    // Create sprite from circle
    sprite = game.add.sprite(game.world.centerX, game.world.height);
    sprite.addChild(circle);
    sprite.anchor.set(0.5);
    game.physics.arcade.enable(sprite);
    sprite.body.collideWorldBounds = true;
    sprite.body.setSize(50, 50);
}

function update() {
    // Accelerate towards the pointer if pointer down, otherwise decelerate
    // if (game.physics.arcade.distanceToPointer(sprite, game.input.activePointer) > 50
    //     && game.input.activePointer.isDown) {
    //     game.physics.arcade.accelerateToPointer(sprite, game.input.activePointer, 240);
    //     // game.physics.arcade.moveToPointer(sprite, 240, game.input.activePointer, 500);
    // }
    // else {
    //     // sprite.body.acceleration.set(0);

    //     var spriteX = sprite.body.velocity.getMagnitude() == 0 ? 0 : sprite.body.velocity.x * 0.8;
    //     var spriteY = sprite.body.velocity.getMagnitude() == 0 ? 0 : sprite.body.velocity.y * 0.8;
    //     sprite.body.velocity.set(spriteX, spriteY);

    //     // sprite.body.velocity.set(0);
    // }

    // Make sound, adjust circle attributes
    if (game.input.activePointer.isDown) {
        // sprite.tint = 0xAAAAAA;
        if (!activeInputPreviouslyDown) {
            circle.clear();
            circle.beginFill(0xCCCCCC, 1);
            circle.drawCircle(0, 0, 55);

            synthP1.triggerAttack("C4");

            var syncDegree = calculateSyncDegree();
            var spriteVel = syncDegree * spriteVelMax;
            game.physics.arcade.moveToPointer(sprite, spriteVel, game.input.activePointer);

            console.log("Sync degree: " + syncDegree);
        }
        else {
            // synthP1.frequency.value += 0.25;
        }
        activeInputPreviouslyDown = true;
    }
    else {
        // sprite.tint = 0x888888;
        if (activeInputPreviouslyDown) {
            circle.clear();
            circle.beginFill(0x888888, 1);
            circle.drawCircle(0, 0, 50);

            synthP1.triggerRelease();
        }
        activeInputPreviouslyDown = false;
    }
}

function render() {
    // game.debug.geom(circle, "rgba(150, 150, 150, 1)");
    // game.debug.pointer(game.input.activePointer);
}