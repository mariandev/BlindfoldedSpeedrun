var bg_canvas, bg_ctx;
var floor_canvas, floor_ctx;
var walls_canvas, walls_ctx;
var objects_canvas, objects_ctx;
var light_canvas, light_ctx;
var entities_canvas, entities_ctx;
var fx_canvas, fx_ctx;
var gui_canvas, gui_ctx;

var tile_width = 32;
var tile_height = 32;
var width = 20 * tile_width;
var height = 20 * tile_height;

var level = 0;
var state = 0;
var teleporting = false;
var do_not_teleport = false;
var lastTS = 0;
var score_added = false;
var user_logged_in = false;

var showing_countdown = false;

var ss;

var map;

var light_level = 0.85;

var animations = [];

var sounds = {};

var keys = [];

var player = {
    x: 0,
    y: 0,
    rx: 0,
    ry: 0,
    speed: 15,
    scale: 1,
    dir: 0,
    beginTime: 0,
    endTime: 0,
    totalTime: 0,
    levelTempTime: 0,
    update: function(dt) {
        
        if(teleporting || showing_countdown) return;
        
        var lx = player.x;
        var ly = player.y;
        var s = player.speed * dt;
        
        if(keys[37]){
            
            if(map.tiles[Math.floor(player.ry)][Math.floor(player.rx - s)] === 0 && !is_door_at_xy(Math.floor(player.rx - s), Math.floor(player.ry))) {
                player.rx -= s;
                player.x   = Math.floor(player.rx);
            }
            
            player.dir = 3;
            
        }
        if(keys[39]){
            
            if(map.tiles[Math.floor(player.ry)][Math.floor(player.rx + s)] === 0 && !is_door_at_xy(Math.floor(player.rx + s), Math.floor(player.ry))) {
                player.rx += s;
                player.x   = Math.floor(player.rx);
            }
            
            player.dir = 1;
            
        }
        
        if(keys[38]){
            
            if(map.tiles[Math.floor(player.ry - s)][Math.floor(player.rx)] === 0 && !is_door_at_xy(Math.floor(player.rx), Math.floor(player.ry - s))) {
                player.ry -= s;
                player.y   = Math.floor(player.ry);
            }
            
            player.dir = 0;
            
        }
        if(keys[40]){
            
            if(map.tiles[Math.floor(player.ry + s)][Math.floor(player.rx)] === 0 && !is_door_at_xy(Math.floor(player.rx), Math.floor(player.ry + s))) {
                player.ry += s;
                player.y   = Math.floor(player.ry);
            }
            
            player.dir = 2;
            
        }
        
        if(lx !== player.x || ly != player.y) {
            do_not_teleport = false;
        }
        
    }
};

function init_game(cb) {
    bg_canvas = document.getElementById("bg");
    bg_ctx=  bg_canvas.getContext("2d");
    
    floor_canvas = document.getElementById("floor");
    floor_ctx=  floor_canvas.getContext("2d");
    
    walls_canvas = document.getElementById("walls");
    walls_ctx=  walls_canvas.getContext("2d");
    
    objects_canvas = document.getElementById("objects");
    objects_ctx=  objects_canvas.getContext("2d");
    
    light_canvas = document.getElementById("light");
    light_ctx=  light_canvas.getContext("2d");
    
    entities_canvas = document.getElementById("entities");
    entities_ctx=  entities_canvas.getContext("2d");
    
    fx_canvas = document.getElementById("fx");
    fx_ctx=  fx_canvas.getContext("2d");
    
    gui_canvas = document.getElementById("gui");
    gui_ctx=  gui_canvas.getContext("2d");
    
    bg_canvas.width =floor_canvas.width = walls_canvas.width = objects_canvas.width = light_canvas.width = entities_canvas.width = fx_canvas.width = gui_canvas.width = width;
    bg_canvas.height = floor_canvas.height = walls_canvas.height = objects_canvas.height = light_canvas.height = entities_canvas.height = fx_canvas.height = gui_canvas.height = height;
    
    ss = new Image();
    
    ss.onload = (function(cb) {
        cb();
    }).bind(this, cb);
    ss.src = 'assets/spritesheet.png';
    
    /*sounds.teleport = new buzz.sound( "assets/sounds/teleport", {
        formats: [ "ogg" ]
    });
    
    sounds.pickup = new buzz.sound( "assets/sounds/pickup", {
        formats: [ "ogg" ]
    });*/
    
    //GJAPI.UserLogout();
    GJAPI.UserFetchCurrent(function(pResponse){
        if(pResponse.success) {
            user_logged_in = true;
        }else {
            GJAPI.UserLoginManual(GJAPI.sUserName, GJAPI.sUserToken, function(pResponse){
                if(pResponse.success)
                    user_logged_in = true;
            });
        }
    });
    
    
    bg_ctx.rect(0, 0, width, height);

    // create radial gradient
    var grd = bg_ctx.createRadialGradient(width / 2, height / 2, 10, width/2, height/ 2 , width/2);
    // light blue
    //grd.addColorStop(0, '#141e20');
    grd.addColorStop(0, "#050505");
    // dark blue
    grd.addColorStop(1, '#000');

    bg_ctx.fillStyle = grd;
    bg_ctx.fill();
    
    var n = 1000;
    for(var i=0;i<n;i++) {
        bg_ctx.beginPath();
        var x = Math.random() * width;
        var y = Math.random() * height;
        var d = Math.sqrt( ( width / 2 - x ) * ( width / 2 - x ) + ( height / 2 - y ) * ( height / 2 - y ) );
        bg_ctx.rect(x, y, 1, 1);
        bg_ctx.fillStyle = 'rgba(255, 255, 255, ' + ( 1 - Math.abs( d / width * 2.15 ) ) + ')';
        bg_ctx.fill();
    }
    
    document.addEventListener("keyup", function(e) {
        keys[e.which] = 0;
    });
    
    document.addEventListener("keydown", function(e) {
        
        if(keys[e.which] > 0) keys[e.which] = 2;
        else keys[e.which] = 1;
        
        console.log(e.which + ": " + keys[e.which]);
        
        if(e.which == 32 || (e.which >= 37 && e.which <= 40) )
            e.preventDefault();
    });
    
    
}

function add_countdown(count) {
    light_level = 0;
    add_text_animation(count, width/2, height/2, 40, 80, (function() {
        if(count > 1)
            add_countdown(count - 1);
        else {
            player.beginTime = Date.now();
            showing_countdown = false;
        }
    }).bind(null, count), false, function() {
        light_level += 0.035;
        light_level = light_level > 1 ? 1 : light_level;
        //light_level = 0.85; // just for testing
    });
}

function is_door_at_xy(x, y) {
    if(map.doors)
        for(var i=0;i<map.doors.length;i++)
            if(map.doors[i].dx === x && map.doors[i].dy === y)
                return true;
    return false;
}

function load_map() {
    map = levels[level];
    player_reset();
}

function next_level() {
    level++;
    player.totalTime += player.levelTempTime + player.endTime - player.beginTime;
    teleporting = false;
    player.scale = 1;
    
    showing_countdown = false;
    
    if(level < levels.length) {
        state = 2;
    }else {
        state = 3;
    }
}

function player_reset() {
    player.x = map.start.x;
    player.y = map.start.y;
    player.rx = map.start.x;
    player.ry = map.start.y;
    player.dir = map.start.dir;
    player.beginTime = 0;
    player.endTime = 0;
    player.levelTempTime = 0;
}

function game_reset() {
    total_moves = 0;
    player.totalTime = 0;
    score_added = false;
    level = 0 ;//just for testing
    load_map();
}

function get_pos(id) {
    return {x: Math.floor( id % (ss.width / tile_width) ), y: Math.floor( id / (ss.width / tile_width) )};
}

function add_teleport_animation(x, y, next, teleporter_type, reverse) {
    
    animations.push({
        type: 'teleport',
        light_level: 1,
        rings: 0,
        state: 0,
        speed: 0.1,
        x: x,
        y: y,
        next: next,
        teleporter_type: teleporter_type,
        reverse: reverse || false
    });
    
}

function add_text_animation(text, x, y, from, to, next, reverse, custom) {
    
    animations.push({
        type: 'text',
        speed: 1,
        text: text,
        x: x,
        y: y,
        from: from, 
        to: to,
        current: from,
        next: next,
        custom: custom,
        reverse: reverse || false
    });
    
}

function add_line_animation(ix, iy, fx, fy, len, next) {
    
    animations.push({
        type: 'line',
        speed: 4,
        ix: ix,
        iy: iy,
        fx: fx,
        fy: fy,
        len: len,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        dist: Math.sqrt( (fx - ix) * (fx - ix) + (fy - iy) * (fy - iy) ),
        ang: Math.atan2( (fy - iy), (fx - ix) ),
        per: 0,
        next: next
    });
    
}

function add_circle_animation(x, y, from, to, next) {
    
    animations.push({
        type: 'circle',
        speed: 0.35,
        x: x,
        y: y,
        from: from, 
        to: to,
        current: from,
        next: next
    });
    
}

function render_text(msg, x, y, opts) {
    if(!opts) opts = {};
    gui_ctx.font = opts.font || "normal 30px Arial";
    gui_ctx.fillStyle= opts.color || "white";
    gui_ctx.textAlign = opts.align || "center";
    gui_ctx.fillText(msg, x, y);
}

function pretty_time(ts) {
    var ms = (ts%1000),
        add = "";
    add += ms < 10  ? "0" : "";
    add += ms < 100 ? "0" : ""
    return Math.floor(ts/1000) + ":" + add + ms;
}

function update() {
    
    var ts = Date.now();
    var dt = (ts - lastTS) / 1000;
    lastTS = ts;
    
    if(state === 0) {
        if(keys[32] === 1) {
            keys[32] = 2;
            state = 4;
        }
    }else if(state === 1) {
        
        
        player.update(dt);
            
        for(var i = 0;i < map.teleporters.length;i++) {
            if(map.teleporters[i].x === player.x && map.teleporters[i].y === player.y && !teleporting && !do_not_teleport) {
                //sounds.teleport.play();
                if(map.teleporters[i].task === 'finish') {
                    player.endTime = Date.now();
                    teleporting = true;
                    add_teleport_animation(player.x, player.y, function() { next_level(); }, 'finish');
                }else if(map.teleporters[i].task === 'goto') {
                    teleporting = true;
                    
                    player.levelTempTime += Date.now() - player.beginTime;
                    
                    add_teleport_animation(player.x, player.y, (function(from, to) { 
                        
                        add_line_animation( (map.teleporters[from].x + 0.5) * tile_width, (map.teleporters[from].y + 0.5) * tile_height, (map.teleporters[to].x + 0.5) * tile_width, (map.teleporters[to].y + 0.5 ) * tile_height, 60, (function(to) {
                            
                            do_not_teleport = true;
                        
                            player.x = map.teleporters[to].x;
                            player.y = map.teleporters[to].y;
                            
                            player.rx = map.teleporters[to].x;
                            player.ry = map.teleporters[to].y;
                            
                            add_teleport_animation(player.x, player.y, function() { 
                                
                                teleporting = false;
                                
                                player.beginTime = Date.now();
                                
                            }, 'goto', true);
                            
                        }).bind(null, to));
                        
                    }).bind(null, i,  map.teleporters[i].dest), 'goto');
                }
            }
        }
        
        if(map.doors)
            for(var i=0;i < map.doors.length;i++) {
                if(map.doors[i].kx === player.x && map.doors[i].ky === player.y) {
                    //sounds.pickup.play();
                    add_circle_animation( ( map.doors[i].dx + 0.5 ) * tile_width, ( map.doors[i].dy + 0.5 ) * tile_height, 10, 50, function() {});
                    map.doors.splice(i--, 1);
                }
            }
        
        
        for(var i=0;i<animations.length;i++) {
            if(animations[i].type === 'teleport') {
                if(animations[i].state === 0){
                    animations[i].light_level -= animations[i].speed;
                    if(animations[i].light_level <= -1)
                        animations[i].state = 1;
                }
                if(animations[i].state === 1) {
                    animations[i].rings += animations[i].speed;
                    if(animations[i].rings >= 5)
                        animations[i].state = 2;
                }
                if(animations[i].state === 2) {
                    player.scale += animations[i].speed * ( animations[i].reverse?1:-1 );
                    player.scale = player.scale < 0 ? 0 : player.scale;
                    player.scale = player.scale > 1 ? 1 : player.scale;
                    animations[i].rings -= animations[i].speed;
                    if( (!animations[i].reverse && player.scale <= 0 && animations[i].rings <= -1) || 
                        ( animations[i].reverse && player.scale >= 1 && animations[i].rings <= -1)){
                        animations[i].next();
                        animations.splice(i--, 1);
                    }
                }
            }else if(animations[i].type === 'text') {
                animations[i].current += animations[i].speed * ( animations[i].reverse?-1:1 );
                if(animations[i].custom)
                    animations[i].custom();
                if( (!animations[i].reverse && animations[i].current >= animations[i].to ) ||
                    ( animations[i].reverse && animations[i].current <= animations[i].to)) {
                    animations[i].next();
                    animations.splice(i--, 1);
                }
            }else if(animations[i].type === 'line') {
                animations[i].per += animations[i].speed;
                 
                var d = animations[i].dist * ( animations[i].per / 100 ) ;
                
                animations[i].x1 = animations[i].ix + Math.cos( animations[i].ang ) * d;
                animations[i].y1 = animations[i].iy + Math.sin( animations[i].ang ) * d;
                
                if( animations[i].per >= 100 ) {
                    animations[i].x1 = animations[i].fx;
                    animations[i].y1 = animations[i].fy;
                }
                
                animations[i].x2 = animations[i].ix;
                animations[i].y2 = animations[i].iy;
                
                if(d - animations[i].len > 0) {
                    animations[i].x2 += Math.cos( animations[i].ang ) * (d - animations[i].len);
                    animations[i].y2 += Math.sin( animations[i].ang ) * (d - animations[i].len);
                }
                
                if( d > animations[i].dist + animations[i].len ) {
                    animations[i].next();
                    animations.splice(i--, 1);
                }
                
            }else if(animations[i].type === 'circle') {
                animations[i].current += animations[i].speed;
                if(animations[i].current >= animations[i].to) {
                    animations[i].next();
                    animations.splice(i--, 1)
                }
            }
        }
        
    }else if(state === 2) {
        if(keys[32] === 1) {
            keys[32] = 2;
            load_map();
            state = 1;
            
            showing_countdown = true;
            
            add_countdown(3);
        }
    }else if(state === 3) {
        if(keys[32] === 1) {
            keys[32] = 2;
            state = 0;
        }
    }else if(state === 4) {
        if(keys[32] === 1) {
            keys[32] = 2;
            game_reset();
            state = 1;
            
            showing_countdown = true;
            
            add_countdown(3);
        }
    }
}

function render() {
    
    floor_ctx.clearRect(0 ,0 ,width, height);
    walls_ctx.clearRect(0 ,0 ,width, height);
    objects_ctx.clearRect(0 ,0 ,width, height);
    light_ctx.clearRect(0 ,0 ,width, height);
    entities_ctx.clearRect(0 ,0 ,width, height);
    fx_ctx.clearRect(0 ,0 ,width, height);
    gui_ctx.clearRect(0 ,0 ,width, height);
    
    if(state == 0) {
        
        render_text("Blindfolded Speedrun", width/2, 50, {font: 'bold 50px Arial'});
        render_text("Press SPACE to continue", width/2, height/2);
        
    }else if(state == 1) {
        for(var y=0;y<map.tiles.length;y++)
            for(var x = 0; x < map.tiles[0].length;x++) {
                var pos = get_pos(map.tiles[y][x]);
                if(map.tiles[y][x] == 0)
                    floor_ctx.drawImage(ss, pos.x * tile_width, pos.y * tile_height, tile_width, tile_height, x * tile_width, y * tile_height, tile_width, tile_height);
                else if((map.tiles[y][x] > 0 && map.tiles[y][x] < 18 && map.tiles[y][x] != 12) || map.tiles[y][x] === 22 || map.tiles[y][x] === 23 || map.tiles[y][x] === 29)
                    walls_ctx.drawImage(ss, pos.x * tile_width, pos.y * tile_height, tile_width, tile_height, x * tile_width, y * tile_height, tile_width, tile_height);            
                else
                    objects_ctx.drawImage(ss, pos.x * tile_width, pos.y * tile_height, tile_width, tile_height, x * tile_width, y * tile_height, tile_width, tile_height); 
                light_ctx.beginPath();
                light_ctx.rect(x * tile_width, y * tile_height, tile_width, tile_height);
                if( (x - 1 === player.x && y - 1 == player.y && map.tiles[y-1][x-1] === 0) ||
                    (x - 1 === player.x && y + 1 == player.y && map.tiles[y+1][x-1] === 0) ||
                    (x + 1 === player.x && y - 1 == player.y && map.tiles[y-1][x+1] === 0) ||
                    (x + 1 === player.x && y + 1 == player.y && map.tiles[y+1][x+1] === 0) ||
                    (x - 2 === player.x && y     == player.y && map.tiles[y][x-2] === 0 && map.tiles[y][x-1] === 0) ||
                    (x + 2 === player.x && y     == player.y && map.tiles[y][x+2] === 0 && map.tiles[y][x+1] === 0) ||
                    (x     === player.x && y - 2 == player.y && map.tiles[y-2][x] === 0 && map.tiles[y-1][x] === 0) ||
                    (x     === player.x && y + 2 == player.y && map.tiles[y+2][x] === 0 && map.tiles[y+1][x] === 0)) {
                    light_ctx.fillStyle = "rgba(0, 0, 0, " + Math.min(0.75, light_level) + ")";
                }else if( (x - 1 === player.x && y == player.y && map.tiles[y][x-1] === 0) ||
                          (x + 1 === player.x && y == player.y && map.tiles[y][x+1] === 0) ||
                          (x === player.x && y - 1 == player.y && map.tiles[y-1][x] === 0) ||
                          (x === player.x && y + 1 == player.y && map.tiles[y+1][x] === 0) ) {
                    light_ctx.fillStyle = "rgba(0, 0, 0, " + Math.min(0.5, light_level) + ")";
                }else if( (x === player.x && y == player.y) || map.tiles[y][x] === 35){
                    light_ctx.fillStyle = "rgba(0, 0, 0, 0)";
                }else{
                    light_ctx.fillStyle = "rgba(0, 0, 0, "+ light_level +")";
                }
                
                light_ctx.closePath();
                light_ctx.fill();
                
            }
        
        var time;
        if(showing_countdown) time = 0;
        else if(player.endTime !== 0) time = player.levelTempTime + player.endTime - player.beginTime;
        else if(teleporting) time = player.levelTempTime;
        else time = player.levelTempTime + Date.now() - player.beginTime;
        render_text(pretty_time(time), width/2, 40, {align: "center"}); 
            
        var pos_light_blue = get_pos(20);
        var pos_green = get_pos(26);
        for(var i = 0;i < map.teleporters.length;i++) {
            if(map.teleporters[i].task === 'goto')
                objects_ctx.drawImage(ss, pos_light_blue.x * tile_width, pos_light_blue.y * tile_height, tile_width, tile_height, map.teleporters[i].x * tile_width, map.teleporters[i].y * tile_height, tile_width, tile_height);
            else if(map.teleporters[i].task === 'finish')
                objects_ctx.drawImage(ss, pos_green.x * tile_width, pos_green.y * tile_height, tile_width, tile_height, map.teleporters[i].x * tile_width, map.teleporters[i].y * tile_height, tile_width, tile_height);
            
        }
            
            
        entities_ctx.save();
        entities_ctx.translate( (player.x + 0.5) * tile_width , (player.y + 0.5) * tile_height );
        entities_ctx.rotate( Math.PI/2 * player.dir );
        entities_ctx.scale(player.scale, player.scale);
        var pos = get_pos(19);
        entities_ctx.drawImage(ss, pos.x * tile_width, pos.y * tile_height, tile_width, tile_height, -tile_width/2, -tile_height/2, tile_width, tile_height);
        entities_ctx.restore();
        
        var pos_light_blue = get_pos(21);
        var pos_green = get_pos(27);
        for(var i=0;i<animations.length;i++) {
            if(animations[i].type === 'teleport'){
                if(animations[i].teleporter_type === 'goto') {
                    if(animations[i].state > 0) {
                        for(var j=0; j < Math.floor(animations[i].rings);j++) {
                            fx_ctx.drawImage(ss, pos_light_blue.x * tile_width, pos_light_blue.y * tile_height, tile_width, tile_height, animations[i].x * tile_width, animations[i].y * tile_height - (j * animations[i].rings), tile_width, tile_height);
                        }
                    }
                }else if(animations[i].teleporter_type === 'finish') {
                    if(animations[i].state > 0) {
                        for(var j=0; j < Math.floor(animations[i].rings);j++) {
                            fx_ctx.drawImage(ss, pos_green.x * tile_width, pos_green.y * tile_height, tile_width, tile_height, animations[i].x * tile_width, animations[i].y * tile_height - (j * animations[i].rings), tile_width, tile_height);
                        }
                    }
                }
            }else if(animations[i].type === 'text'){
                
                render_text(animations[i].text, animations[i].x, animations[i].y, {
                    font: 'normal ' + animations[i].current +  'px Arial',
                    color: 'rgba(255, 255, 255, ' + ( 1 - ( animations[i].current - animations[i].from ) / ( animations[i].to - animations[i].from ) ) + ')'
                });
                
            }else if(animations[i].type === 'line') {
                
                fx_ctx.beginPath();
                fx_ctx.moveTo(animations[i].x1, animations[i].y1);
                fx_ctx.lineTo(animations[i].x2, animations[i].y2);
                
                var gr = fx_ctx.createLinearGradient(animations[i].x1, animations[i].y1, animations[i].x2, animations[i].y2);
                gr.addColorStop(0, "rgba(152, 210, 255, 1)");
                gr.addColorStop(1, "rgba(152, 210, 255, 0)");
                
                fx_ctx.strokeStyle = gr;
                fx_ctx.stroke();
                
            }else if(animations[i].type === 'circle') {
                var per = ( animations[i].to - animations[i].current ) / animations[i].to;
                for(var j=0;j < 3;j++) {
                    var rad = ( ( j + 1)  * ( 1 - per ) * 30);
                    fx_ctx.beginPath();
                    fx_ctx.arc(animations[i].x, animations[i].y, rad, 0, 2 * Math.PI, false);
                    fx_ctx.strokeStyle = "rgba(255, 0, 0, " + ( 1 - rad / 30 ) + ")";
                    fx_ctx.stroke();
                }
            }
        }
        
        if(map.doors){
            for(var i=0;i<map.doors.length;i++) {
                var pos;
                if(map.doors[i].dir === 'WE') {
                    pos = get_pos( 30 );
                }else if(map.doors[i].dir === 'NS') {
                    pos = get_pos( 24 );
                }
                objects_ctx.drawImage(ss, pos.x * tile_width, pos.y * tile_height, tile_width, tile_height, map.doors[i].dx * tile_width, map.doors[i].dy * tile_height, tile_width, tile_height);
            
                pos = get_pos(28);
                objects_ctx.drawImage(ss, pos.x * tile_width, pos.y * tile_height, tile_width, tile_height, map.doors[i].kx * tile_width, map.doors[i].ky * tile_height, tile_width, tile_height);
            }
        }
        
        
    }else if(state ===  2) {
        
        render_text("Level cleared", width/2, 50, {font: 'bold 50px Arial'});
        render_text("Level time: " + pretty_time(player.levelTempTime + player.endTime - player.beginTime), width/2, 150);
        render_text("Press SPACE to advance", width/2, height/2);
        
    }else if(state ===  3) {
        
        render_text("All levels cleared", width/2, 50, {font: 'bold 50px Arial'});
        render_text("Level time: " + pretty_time(player.levelTempTime + player.endTime - player.beginTime), width/2, 150);
        render_text("Total time: " + pretty_time(player.totalTime), width/2, 190);
        render_text("Press SPACE to go to the menu", width/2, height/2);
        
        addScore();
        
    }else if(state === 4) {
        
        render_text("All you need to know", width/2, 50, {font: 'bold 50px Arial'});
        render_text("1. This is s speedrun so you have to move ", width/2, 120);
        render_text("as fast as possible", width/2, 160);
        render_text("2. You have 3 seconds to memorize the", width/2, 200);
        render_text("whole map before you begin.", width/2, 240);
        
        render_text("Good luck!", width/2, 340);
        render_text("Press SPACE to play", width/2, 390);
        
    }
}

function loop() {
    requestAnimFrame(loop);
    
    update();
    render();
    
}

function addScore() {
    if(!score_added) {
        score_added = true;
        if(user_logged_in)
            GJAPI.ScoreAdd(46388, player.totalTime, pretty_time(player.totalTime));
    }
}

window.onload = function() {
    init_game(function() {
        
        loop();
        
    });
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();