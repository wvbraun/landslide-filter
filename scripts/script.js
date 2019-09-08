
//Header
//Copyright 20__-present, Facebook, Inc.
//All rights reserved.
//This source code is licensed under the license found in the
//LICENSE file in the root directory of this source tree.

const R = require("Reactive");
const A = require("Animation");
const S = require("Scene");
const T = require("TouchGestures");
const Time = require("Time");
const Audio = require("Audio");
const D = require('Diagnostics');

var frame_balloon_indices = [32, 26, 25, 23, 24, 34, 27];

var balloons = [];
var number_of_balloons = 39;
var number_of_low_explosive_balloons = 36;

var loop_bounce_amount = 16;
var loop_bounce_time = 8000;
var loop_rotate_time = 30000;
var light_rotate_time = 300000;


var burst_length = 300;
var signle_emitter_burst_birth_rate = 10000;
var multi_emitter_burst_birth_rate = 2500;


var sound_pads = [];
var number_of_sound_pads = 6;

/*
const playback_controller0 = Audio.getPlaybackController("main_loop_controller");
const playback_controller1 = Audio.getPlaybackController("kick_loop_controller");
const playback_controller2 = Audio.getPlaybackController("snap_loop_controller");
const playback_controller3 = Audio.getPlaybackController("closed_hats_loop_controller");
const playback_controller4 = Audio.getPlaybackController("open_hats_loop_controller");


const playback_controllers = [
	playback_controller0,
	playback_controller1,
	playback_controller2,
	playback_controller3,
	playback_controller4
];
*/

var playback_controller_names = [
	"main_loop_controller",
	"kick_loop_controller",
	"snap_loop_controller",
	"closed_hats_loop_controller",
	"open_hats_loop_controller",
	"snare_loop_controller"
];

var playback_controllers = [];
for (var i = 0; i < playback_controller_names.length; i++) {
	playback_controllers.push(
		Audio.getPlaybackController(playback_controller_names[i])
	);
}

/*
const playback_controllers = [
	Audio.getPlaybackController("kick_loop_controller"),
	Audio.getPlaybackController("snap_loop_controller"),
	Audio.getPlaybackController("closed_hats_loop_controller"),
	Audio.getPlaybackController("open_hats_loop_controller")
];
*/


for (var i = 0; i < playback_controllers.length; i++) {
	playback_controllers[i].setPlaying(false);
	playback_controllers[i].setLooping(true);
}

var can_play_audio = false;

/*
var resetPlayer = Time.setTimeout(function (elapsedTime) {
  can_play_audio = false;
}, 3000);
*/

// landslide = 11773
var song_length = 11774

var currentTime = 0;
/*
Time.ms.interval(1).subscribe(function (elapsedTime) {
  currentTime += 1; //1774;
  if (currentTime >= song_length) {
    for (var i = 0; i < number_of_loops; ++i) {
      loops[i].audiosource.hidden = !(loops[i].can_play_audio);
    }
    currentTime = 0;
  }
});
*/

/*
Time.ms.interval(song_length).subscribe(function (elapsedTime) {
  can_play_audio = true;
  D.log(Time.ms.lastValue);
  D.log(elapsedTime);
  for (var i = 0; i < number_of_loops; ++i) {
    loops[i].audiosource.hidden = !(loops[i].can_play_audio);
  }
  Time.clearTimeout(resetPlayer);
});
*/

var active_sounds = [];

var play_sounds = function() {
	for (var i = 0; i < active_sounds.length; i++) {
		active_sounds[i].reset();
		active_sounds[i].setPlaying(true);
	}
};

var tapRegistrar = function(sound_pad) {
	T.onTap(sound_pad.rotater).subscribe(function(gesture) {
    //loop.can_play_audio = loop.can_play_audio ? false : true;
    //loop.audiosource.hidden = loop.audiosource.hidden ? false : true;
		// Audio.play(loop.audiosource);
		//loop.rotater.hidden = true;

		if (sound_pad.is_playing) {
			sound_pad.is_playing = false;
			var i = active_sounds.indexOf(sound_pad.playback_controller);
			if (i > -1) {
				active_sounds.splice(i, 1);
			}
			sound_pad.playback_controller.setPlaying(false);
			sound_pad.playback_controller.reset();
		} else {
			sound_pad.is_playing = true;
			active_sounds.push(sound_pad.playback_controller);
			play_sounds();
			//loop.playback_controller.setPlaying(true);
		}

		//for (var i = 0; i < loop.emitter.length; i++) {
		//	birthrate_driver = A.timeDriver(burst_length);
		//	birthrate_sampler = A.samplers.easeOutQuart(loop.emitter_target_birthrate[i], 0);
		//	loop.emitter[i].birthrate = A.animate(birthrate_driver, birthrate_sampler);
		//	birthrate_driver.start();
		//}
	});
}

/*
build balloons array:
balloons[]
	mover - scene object for y movement
	rotater - scene object for y rotation
	bounce_driver - animation driver for y movement
	rotate_driver - animation driver for y rotation
	bounce_sampler - animation sampler for y movement
	rotate_rando - animation sampler for y rotation
	emitter[] - array of emitters per balloon 1 emitter per colored balloon (0-35) 5 emitters for the polka dot balloons (36-38)
	emitter_target_birthrate[] = array of target birth rates for each emitter
*/

for (var i = 0; i < number_of_sound_pads; i++){
	//get randomizers for movement and rotation
	var bounce_rando = getRandomArbitrary(0, loop_bounce_amount)
	var up_down = Math.floor(getRandomArbitrary(0, 2))
	var spin_randomizer = Math.floor(getRandomArbitrary(0, 2))

  var fd = S.root.child("Device").child("Camera").child("Focal Distance");
	//build loops array
	sound_pads[i] = {
		mover: fd.child("loop_group").child("loop_move_"+i),
		rotater: fd.child("loop_group").child("loop_move_"+i).child("loop_"+i),
		bounce_driver: null, // A.yoyoTimeDriver(loop_bounce_time),
		rotate_driver: null, // A.loopTimeDriver(loop_rotate_time),
		bounce_sampler: null,
		rotate_sampler: null,
		audiosource: S.root.child("speaker"+i),
		playback_controller: playback_controllers[i],
		emitter:[],
		emitter_target_birthrate:[],
		is_playing: false,
    can_play_audio: false
	};
  //loops[i].audiosource.hidden = (i !== 0);
  //loops[i].can_play_audio = (i === 0);

  /*
	//set balloon animation parameters
	var balloon_y = balloons[i].mover.transform.y.lastValue;
	if (up_down == 1){
		balloons[i].bounce_sampler = A.samplers.easeInOutSine(balloon_y, balloon_y + bounce_rando);
	}
	else{
		balloons[i].bounce_sampler = A.samplers.easeInOutSine(balloon_y, balloon_y - bounce_rando);
	}
	balloons[i].mover.transform.y = A.animate(balloons[i].bounce_driver, balloons[i].bounce_sampler);
	balloons[i].bounce_driver.start();

	if (spin_randomizer == 1){
		balloons[i].rotate_sampler = A.samplers.linear(0, Math.PI*2);
	}
	else{
		balloons[i].rotate_sampler = A.samplers.linear(0, -Math.PI*2);
	}
	balloons[i].rotater.transform.rotationY = A.animate(balloons[i].rotate_driver, balloons[i].rotate_sampler);
	balloons[i].rotate_driver.start();
  */

	tapRegistrar(sound_pads[i]);
}

//helper function
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
