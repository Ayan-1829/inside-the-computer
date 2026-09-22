/* ==========================================================
   data/devices-inside.js
   The parts inside each input and output device (level 3). Each device in
   data/devices.js has a scene of the same name in scenes/devices.js that draws
   these parts. Edit the text here, then run: node build/build.mjs
   ========================================================== */
function inside(parent, id, name, tip, short, what, does, why, ex, specs, fact, rel){
  def(id, {name:name, parent:parent, level:3, levelLabel:'Internal components', tip:tip, short:short, what:what, does:does, why:why, ex:ex, specs:specs, fact:fact, rel:rel});
}

/* ---------------- Inside the microphone (a USB condenser mic) ---------------- */
inside('mic','mic-capsule','Capsule','A thin membrane that vibrates with the sound',
 'A very thin membrane (the diaphragm) facing a fixed metal plate. Sound makes the membrane move.',
 'In a condenser microphone the capsule is a tiny capacitor. One plate is the diaphragm, a membrane thinner than a hair, coated with metal. The other is a rigid backplate a fraction of a millimetre behind it. A small voltage keeps the two plates charged.',
 'Sound is a wave of changing air pressure. It pushes the diaphragm back and forth, which changes the gap to the backplate. A smaller gap means more capacitance, so the voltage across the plates rises and falls in step with the sound: an electrical copy of the wave.',
 'Because the diaphragm is so light, it follows even faint, high-pitched sounds closely. That is why condenser microphones are sensitive and detailed, and why they are used for voices and studio recording.',
 [['Large-diaphragm capsule','Warm, detailed voices in studio mics'],['Electret capsule','A pre-charged capsule in laptops and phones'],['MEMS microphone','A capsule etched into a silicon chip']],
 [['Diaphragm','a few microns thick, metal-coated'],['Gap to backplate','about 20 to 50 micrometres'],['Signal','only a few millivolts']],
 'For the quietest sounds you can hear, your eardrum moves by less than the width of an atom; a good microphone is built to respond to movements almost as small.',
 [['mic-preamp','Boosts the capsule’s tiny signal'],['speaker-cone','Works the opposite way: a moving membrane makes sound']]);

inside('mic','mic-preamp','Preamplifier','Boosts the tiny signal so it is not lost in noise',
 'A small amplifier that makes the capsule’s very weak signal strong enough to work with.',
 'A low-noise amplifier chip on the microphone’s board, placed right next to the capsule. In a condenser mic it also converts the capsule’s very high impedance to a low one, so the signal can travel along wires.',
 'It takes the tiny voltage from the capsule and makes it many times larger, while adding as little electrical noise as possible. It is powered from the same USB cable (or from phantom power on a studio mic).',
 'The capsule’s signal is so weak that any noise picked up along the way would drown it. Amplifying it early, before it goes anywhere, keeps voices clean.',
 [['FET impedance converter','The first stage in most condenser mics'],['Op-amp gain stage','Sets the microphone’s volume'],['Phantom power','48 V supply for studio condenser mics']],
 [['Gain','often 20 to 40 dB in the mic itself'],['Noise','the quieter, the better the mic'],['Power','from USB, or 48 V phantom power']],
 'The noise of a good microphone preamp is so low that it is limited by the random motion of electrons in the components themselves.',
 [['mic-capsule','Where the signal comes from'],['mic-adc','Turns the amplified signal into numbers']]);

inside('mic','mic-adc','ADC','Analog-to-digital converter: turns the voltage into numbers',
 'An analog-to-digital converter measures the signal thousands of times a second and records each measurement as a number.',
 'The ADC is a chip (often built into the same one as the USB controller in a USB mic). It looks at the amplified voltage many times per second and writes down its value as a binary number.',
 'A typical setting is 48,000 measurements a second (the sample rate), each stored with 16 or 24 bits (the bit depth). Together the stream of numbers describes the sound wave closely enough to rebuild it later.',
 'Computers can only work with numbers. The ADC is the step where real-world sound becomes data that can be stored, sent over the internet and processed by software.',
 [['44.1 kHz, 16-bit','CD-quality audio'],['48 kHz, 24-bit','Common for video and recording'],['96 kHz and up','High-resolution studio audio']],
 [['Sample rate','44,100 or 48,000 samples per second'],['Bit depth','16 or 24 bits per sample'],['Also called','A/D converter']],
 'To capture a sound, the ADC must sample at more than twice its highest frequency. Humans hear up to about 20 kHz, which is why audio is sampled at 44.1 or 48 kHz.',
 [['mic-preamp','Supplies the signal it measures'],['mic-usb','Sends the numbers to the computer'],['speaker-dac','The reverse conversion, numbers back to a voltage']]);

inside('mic','mic-usb','USB interface','Sends the digital audio to the computer',
 'The USB controller and connector that send the digital audio to the computer and power the microphone.',
 'A small controller chip packages the ADC’s numbers into USB audio packets. The USB connector carries those packets to the computer and also brings 5 V of power back to the microphone.',
 'To the computer, the microphone looks like a standard USB audio device, so no special driver is needed. The operating system reads the packets and hands the sound to whichever app is recording.',
 'USB makes a microphone plug-and-play, and it lets a single cable carry both the audio out and the power in.',
 [['USB Audio Class','The standard that lets any computer use the mic'],['USB-C mic','The same idea with a newer connector'],['Bluetooth mic','Sends the packets by radio instead of a cable']],
 [['Standard','USB Audio Class (no driver needed)'],['Power','5 V from the USB port'],['Data','48,000 samples per second per channel']],
 'Many USB microphones are limited by the electronics, not by the capsule: a cheap converter can waste the quality of an excellent capsule.',
 [['usb','The port it plugs into'],['mic-adc','Where the numbers come from'],['io','Where the cable ends up in the computer']]);

/* ---------------- Inside the speakers (a powered USB speaker) ---------------- */
inside('speakers','speaker-dac','DAC','Digital-to-analog converter: turns numbers back into a voltage',
 'A digital-to-analog converter turns the stream of numbers describing the sound back into a smoothly changing voltage.',
 'The DAC is a chip that receives digital audio (from USB, or from the computer’s audio chip) and produces a small analog voltage that copies the original sound wave.',
 'Every sample, 44,100 or 48,000 times a second, sets the output voltage to the value of that number. A filter smooths the steps into a continuous wave, ready to be amplified.',
 'Speakers move in response to a voltage, not to numbers. The quality of the DAC decides how faithfully the digital recording is turned back into sound.',
 [['USB speaker DAC','Inside the speaker, so the cable carries only data'],['Motherboard audio codec','The DAC on the computer’s own audio jacks'],['External DAC','A separate box for better sound']],
 [['Input','digital audio (USB or I2S)'],['Output','a small analog voltage (about 1 to 2 V)'],['Sample rate','44,100 to 192,000 samples per second']],
 'A DAC chip can be only a couple of millimetres across, yet it turns tens of thousands of numbers a second into a continuous sound wave.',
 [['speaker-amp','Strengthens the DAC’s output'],['mic-adc','The reverse conversion, voltage to numbers'],['audio','The computer’s own audio jacks have a DAC too']]);

inside('speakers','speaker-amp','Amplifier','Makes the signal strong enough to move the cone',
 'Makes the DAC’s small signal strong enough to push the coil and cone.',
 'A power amplifier chip, usually with a small heatsink. Most speakers use a class-D amplifier, which switches its outputs on and off very fast, so it wastes little energy as heat.',
 'It copies the shape of the small input signal onto a much stronger current, enough to drive the voice coil. Desktop speakers use a few watts; a home speaker can use over 100 W.',
 'The DAC’s output has almost no power: it could not move a cone on its own. Without the amplifier, there would be no audible sound.',
 [['Class-D amplifier','Efficient, common in small and USB speakers'],['Class-AB amplifier','Warmer sound, more heat, in some hi-fi speakers'],['Headphone amplifier','A small version for headphones']],
 [['Power','a few watts to over 100 W'],['Types','Class-D (efficient) or Class-AB'],['Supply','5 V from USB, or a wall adapter']],
 'A class-D amplifier switches on and off hundreds of thousands of times a second; the coil is too slow to follow the switching, so it responds only to the average, which is the sound.',
 [['speaker-dac','Supplies the signal it strengthens'],['speaker-coil','Receives the strong current'],['psu','A larger power supply of the same idea']]);

inside('speakers','speaker-magnet','Magnet','A permanent magnet the coil pushes against',
 'A strong permanent magnet that sets up the magnetic field the voice coil sits in.',
 'A ring or disc of ferrite or neodymium, held between metal plates that guide its field into a narrow gap. The voice coil sits in that gap.',
 'The magnet’s field never changes. When current flows through the coil, the coil becomes an electromagnet and is pushed or pulled by the fixed field, first one way, then the other.',
 'A stronger magnet gives more force for the same current, so a speaker gets louder and more efficient. Neodymium magnets are stronger and lighter, which is why they are used in small speakers and headphones.',
 [['Ferrite (ceramic) magnet','Cheap and heavy, in most speakers'],['Neodymium magnet','Very strong and light, in headphones and small speakers'],['Magnetic shielding','A second magnet that cancels stray field near screens']],
 [['Material','ferrite or neodymium'],['Field in the gap','about 1 tesla'],['Weight','from a few grams to several kilograms']],
 'Old CRT monitors could be discoloured by a speaker magnet placed too close, which is why computer speakers were often built with magnetic shielding.',
 [['speaker-coil','Sits in the magnet’s field'],['hdd-head','Another part that relies on magnetism']]);

inside('speakers','speaker-coil','Voice coil','A coil of wire that moves in the magnetic field',
 'A light coil of wire, attached to the cone, that moves back and forth when the audio current flows through it.',
 'A few dozen turns of very thin wire wound on a paper or plastic tube, suspended in the magnet’s gap so it can slide freely. It is glued to the back of the cone.',
 'The amplifier’s current makes the coil an electromagnet. Its force against the fixed magnet pushes the coil forward and pulls it back, following the shape of the sound wave, and it takes the cone with it.',
 'This is where electricity becomes motion. The coil has to be light, so it can start and stop thousands of times a second, and it must stay cool while doing it.',
 [['Copper coil','The usual choice'],['Aluminium coil','Lighter, used in some tweeters'],['Dual voice coil','Two coils on one cone, in some subwoofers']],
 [['Wire','copper or aluminium, about as thin as a hair'],['Impedance','commonly 4 or 8 ohms'],['Movement','usually less than a centimetre']],
 'The same principle runs in reverse in a dynamic microphone: sound moves a coil through a magnetic field and produces a tiny current.',
 [['speaker-magnet','Provides the field it moves in'],['speaker-cone','Carries the coil’s movement into the air'],['speaker-amp','Supplies its current']]);

inside('speakers','speaker-cone','Cone','The moving surface that pushes the air',
 'A light, stiff cone that moves with the coil and pushes on the air to make sound waves.',
 'A cone-shaped diaphragm of paper, plastic or metal, held at its edge by a flexible ring (the surround) and near its tip by a corrugated disc (the spider), so it can only move forward and back.',
 'As the coil moves the cone in and out, the cone squeezes and stretches the air in front of it. That pattern of high and low pressure spreads out as the sound waves your ear picks up.',
 'A bigger cone moves more air and can make deeper bass; a small one moves faster and suits high notes. That is why many speakers use several sizes: a woofer for bass and a tweeter for treble.',
 [['Woofer','A large cone for low notes'],['Tweeter','A small dome for high notes'],['Full-range driver','One cone for everything, in small desktop speakers']],
 [['Material','paper, plastic or metal'],['Size','about 2 cm (tweeter) to over 30 cm (woofer)'],['Movement','back and forth, in step with the coil']],
 'A bass note of 50 Hz makes the cone move back and forth 50 times a second; a note 20 times higher moves it 20 times as often, but by a much smaller distance.',
 [['speaker-coil','Moves the cone'],['mic-capsule','A microphone’s membrane is the same idea in reverse'],['audio','Sound arrives from the computer’s audio output']]);

/* ---------------- Inside the monitor (an LCD) ---------------- */
inside('monitor','monitor-panel','LCD panel','Millions of tiny shutters that let the backlight through',
 'A stack of thin layers in which each pixel is a small liquid-crystal shutter with a red, green or blue filter.',
 'The panel is a sandwich: a rear polarizer, a glass layer of thin-film transistors, a layer of liquid crystal, a colour filter with red, green and blue stripes, and a front polarizer. Every pixel is made of three subpixels, one for each colour.',
 'A transistor sets a voltage on each subpixel. The voltage twists the liquid crystal, which changes how much of the backlight’s polarized light can pass through the front polarizer. Mixing the three colours at different strengths makes every colour you see.',
 'The panel decides the picture’s sharpness (resolution), how fast it updates (refresh rate), and how good the colours and viewing angles are. IPS, VA and TN are three ways of arranging the liquid crystal.',
 [['IPS panel','Accurate colour and wide viewing angles'],['VA panel','Deep blacks and high contrast'],['TN panel','Very fast, but narrower viewing angles'],['OLED panel','No backlight: each pixel makes its own light']],
 [['Resolution','1920 × 1080 (Full HD) to 3840 × 2160 (4K)'],['Refresh rate','60 to 240 Hz'],['Subpixels','over 6 million on a Full HD screen']],
 'A 4K screen has about 8.3 million pixels, so it has almost 25 million tiny coloured subpixels, each with its own transistor.',
 [['monitor-backlight','Supplies the light the panel filters'],['monitor-controller','Tells every pixel what to show'],['gpu','Creates the picture the panel displays']]);

inside('monitor','monitor-backlight','Backlight','White LEDs whose light the panel filters',
 'A light source behind the panel: rows of white LEDs and a plate that spreads their light evenly.',
 'Most monitors have a strip of white LEDs along one edge, facing a clear plastic light guide that spreads the light across the whole screen, with diffuser sheets to even it out. Better monitors put many LEDs behind the panel in zones (local dimming, or mini-LED).',
 'The LEDs shine all the time at the set brightness. The liquid-crystal layer in front only decides how much of that light each pixel lets through, which is how a black pixel is made: by blocking as much light as possible.',
 'The backlight sets the screen’s brightness, and how well it can dim decides how deep the blacks look in a dark room. It is also the part that uses most of a monitor’s power.',
 [['Edge-lit LED','LEDs along the edge: thin and cheap'],['Direct-lit with local dimming','LED zones behind the screen: better contrast'],['Mini-LED','Thousands of tiny LEDs in many zones']],
 [['Light source','white LEDs (or mini-LEDs)'],['Brightness','about 250 to 1,000 nits'],['Dimming','whole screen, or many zones']],
 'A screen showing only black still glows softly on most LCD monitors, because a liquid crystal cannot block every last bit of the backlight.',
 [['monitor-panel','Filters the light it makes'],['monitor-power','Supplies the steady current the LEDs need']]);

inside('monitor','monitor-controller','Controller board','Turns the incoming picture into panel signals',
 'The circuit board that receives the video signal, scales it to the panel’s resolution and drives the panel.',
 'A board with a scaler chip and a timing controller. The scaler receives the video, adjusts brightness, colour and contrast, draws the on-screen menu and, if needed, resizes the picture. The timing controller sends the result to the row and column driver chips along the panel’s edges.',
 'It reads the video stream frame by frame and tells every subpixel row by row what voltage to hold, 60 or more times a second. The buttons on the monitor and the settings menu are read by this board too.',
 'This board is why a monitor can accept several kinds of input and still fill its screen: it converts whatever arrives into exactly what the panel needs.',
 [['Scaler','Resizes pictures to fit the panel'],['Timing controller (T-con)','Drives the panel’s row and column chips'],['On-screen display','The menu drawn by the board itself']],
 [['Job','receive, scale, correct colour, drive the panel'],['Inputs','HDMI, DisplayPort, USB-C'],['Updates','60 to 240 times a second']],
 'When a screen shows a picture that is not its native resolution, the scaler in this board blurs it slightly: it has to guess the missing pixels.',
 [['monitor-ports','Where the picture arrives'],['monitor-panel','What it drives'],['gpu','Sends the picture it receives']]);

inside('monitor','monitor-power','Power board','Turns mains power into the low voltages inside',
 'The board that converts wall power into the low DC voltages the electronics and the backlight need.',
 'A small switch-mode power supply: a rectifier, a transformer and regulators, like a smaller version of the computer’s own power supply. It is inside the monitor, or in the external power brick.',
 'It turns 100 to 240 V AC into a few low DC voltages: a steady supply for the electronics, and a controlled current for the LED backlight. Turning the brightness down lowers that current.',
 'Almost all of a monitor’s power goes to the backlight, which is why turning the brightness down saves energy.',
 [['Built-in power board','In most monitors'],['External power adapter','A power brick on the cable'],['Portable monitor','Powered by the USB-C cable from a laptop']],
 [['Input','100 to 240 V AC'],['Output','a few low DC voltages'],['Power','about 15 to 60 W for a typical monitor']],
 'Turning a monitor’s brightness from full to half can cut its power use by a large fraction, because the backlight is doing almost all the work.',
 [['monitor-backlight','Powers the LEDs'],['psu','The computer’s own power supply']]);

inside('monitor','monitor-ports','Video inputs','HDMI and DisplayPort connectors that bring the picture in',
 'The sockets on the back where the video cable from the computer plugs in.',
 'HDMI, DisplayPort and USB-C sockets connected to the controller board. Each carries the picture as digital data, one frame after another, and many also carry sound.',
 'The cable brings the pixels of every frame, in order, from the computer’s graphics card. The controller board decodes them and passes them to the panel.',
 'The type of port limits the resolution and refresh rate the monitor can show: an old cable may only manage 4K at 30 Hz instead of 60 or more.',
 [['HDMI','Common on TVs and monitors; carries sound too'],['DisplayPort','Popular for high-refresh gaming monitors'],['USB-C (DP Alt Mode)','Picture, power and data in one cable']],
 [['HDMI 2.1','up to 48 Gbit/s'],['DisplayPort 1.4','about 32 Gbit/s'],['Sends','digital pixels for each frame']],
 'A 4K picture at 60 frames per second is about 12 gigabits of data every second, before the cable adds extras for sound and error checking.',
 [['display-outputs','The matching sockets on the computer'],['gpu','Where the picture is made'],['monitor-controller','Receives the signal']]);

/* ---------------- Inside the keyboard ---------------- */
inside('keyboard','kb-keys','Keys and switches','Each key is a switch that closes when pressed',
 'A keycap on a spring-loaded switch. Pressing it closes an electrical contact.',
 'Every key has a plastic keycap on a small switch. In a mechanical keyboard the switch is a plunger, a spring and two metal contacts. In a cheaper membrane keyboard, a rubber dome collapses when pressed and touches the circuit beneath. Laptops use thin scissor mechanisms.',
 'When you press a key, the plunger goes down against the spring, and at a certain point (the actuation point) the contacts touch and close a circuit. Let go, and the spring pushes the key back up and opens it.',
 'The switch decides how a keyboard feels and sounds: how hard you press, how far, whether it clicks. It also decides how long the keyboard lasts.',
 [['Cherry MX','A well-known mechanical switch'],['Rubber dome','Common in office keyboards'],['Scissor switch','Thin keys, found on laptops']],
 [['Actuation force','about 45 to 60 g for many mechanical switches'],['Travel','about 4 mm in a mechanical switch'],['Lifetime','tens of millions of presses']],
 'Some mechanical switches are rated for 50 to 100 million keypresses, enough to type for decades.',
 [['kb-matrix','Where each switch is wired'],['mouse-buttons','Buttons are the same idea: a switch that closes']]);

inside('keyboard','kb-matrix','Switch matrix','Rows and columns that identify which key was pressed',
 'The circuit board that wires every key into a grid of rows and columns.',
 'Instead of one wire per key, the keys are wired in a grid: one wire for each row, one for each column, and a key sitting at each crossing. A full-size keyboard with about 100 keys needs only a few dozen wires this way. Diodes stop a false press appearing (ghosting) when several keys are down together.',
 'The controller sends a signal down one row at a time and listens on all the columns. A signal returning on a column means the key at that row and column is pressed.',
 'The matrix is why a keyboard can be cheap, thin and reliable: it needs far fewer wires and pins than one line per key would.',
 [['Membrane sheet','Printed conductive tracks on plastic films'],['PCB with diodes','A circuit board used in mechanical keyboards'],['Hot-swap sockets','Let you change switches without soldering']],
 [['Layout','rows × columns, for example about 6 × 18'],['Diodes','one per key, to stop ghosting'],['Scan','a row at a time, hundreds of times a second']],
 'Cheap keyboards can fail to register some three-key combinations. That is the matrix’s “ghosting” problem, which the diodes on a good keyboard solve.',
 [['kb-keys','The switches it connects'],['kb-controller','Scans it row by row']]);

inside('keyboard','kb-controller','Controller','A tiny processor that scans the keys',
 'A small microcontroller that scans the matrix, filters out bouncing and reports the keys pressed.',
 'A microcontroller (a tiny complete computer on one chip) sits on the keyboard’s circuit board. It runs a fixed program that never stops scanning the matrix.',
 'It scans all the rows and columns hundreds or thousands of times a second, ignores the flickering when a switch first touches (debouncing), looks up each pressed key in a table, and sends the list of pressed keys to the computer. It also runs the backlight and any special keys.',
 'It is what turns the signals from a grid of switches into meaningful key codes, and it decides how quickly and how many simultaneous key presses are reported.',
 [['1000 Hz polling','A fast scan rate for gaming keyboards'],['Programmable firmware','Lets you remap keys and make macros'],['Wireless controller','Also manages the radio']],
 [['Type','8-bit or 32-bit microcontroller'],['Scan rate','commonly 1000 times a second'],['Job','scan, debounce, map keys, report to the host']],
 'When a keyboard is “n-key rollover”, its controller is fast and clever enough to report every key held down at once.',
 [['kb-matrix','What it scans'],['kb-usb','How it reports to the computer'],['cpu','A bigger processor of the same kind']]);

inside('keyboard','kb-usb','USB interface','Sends key presses to the computer',
 'The cable and connector that carry key presses to the computer and power the keyboard.',
 'A USB cable connects the controller to the computer. The keyboard is a standard “HID” device (human interface device), so any operating system already knows how to talk to it. Wireless keyboards use a Bluetooth or 2.4 GHz radio instead.',
 'Whenever the set of pressed keys changes, the controller sends a short report to the computer. The operating system reads which keys are down and passes them to the app you are typing into. The cable also supplies 5 V of power.',
 'A standard interface is why a keyboard works the moment you plug it in, on any computer, without installing anything.',
 [['USB HID','The standard for keyboards, mice and gamepads'],['Bluetooth keyboard','The same reports sent by radio'],['PS/2','An older keyboard connector']],
 [['Standard','USB HID class'],['Power','5 V from the USB port'],['Report','up to 6 keys at once, or more in n-key rollover mode']],
 'A basic USB keyboard report holds only six key codes at a time, which is why pressing more than six keys at once could once be ignored.',
 [['usb','The port it plugs into'],['kb-controller','Where the reports come from'],['io','Where the cable ends up in the computer']]);

/* ---------------- Inside the mouse (an optical mouse) ---------------- */
inside('mouse','mouse-sensor','Optical sensor','A tiny camera that watches the desk move past',
 'A tiny camera on the underside that photographs the desk surface and works out how the mouse has moved.',
 'An LED (or infrared laser) lights the desk at a low angle, so every little bump in the surface casts a small shadow. A small image sensor takes thousands of pictures a second of that texture. Early optical sensors had only about 18 × 18 pixels.',
 'A processor inside the sensor compares each picture with the one before and works out how far the pattern has shifted: that is how far the mouse has moved, in which direction. It reports the movement as two numbers, one for left-right and one for up-down.',
 'The sensor decides how precisely and quickly the pointer follows your hand. Its resolution is measured in DPI (dots per inch): the number of counts reported for each inch you move.',
 [['Optical LED sensor','The common type; works on most surfaces'],['Laser sensor','Reads glossier surfaces such as glass'],['Gaming sensor','Up to about 25,000+ DPI and thousands of frames a second']],
 [['Resolution','400 to over 25,000 DPI'],['Frame rate','up to several thousand pictures a second'],['Light','red LED or infrared']],
 'A mouse sensor is so good at spotting tiny texture that it can track movement on paper, wood and even fabric, but not on clear glass with nothing to see.',
 [['webcam-sensor','Another image sensor, for a different job'],['mouse-controller','Reads its movement numbers']]);

inside('mouse','mouse-buttons','Buttons','Small switches that click when pressed',
 'A microswitch under each button that makes a click when it is pressed.',
 'Under each button is a microswitch: a small springy metal leaf that snaps between two contacts when pushed past a certain point. The snap gives a crisp click that you can hear and feel.',
 'Pressing the button pushes on the switch, and the leaf snaps to close a circuit. The controller sees the change, and tells the computer a button went down; releasing the button tells it that the button came up.',
 'These switches take the most use of any part of a mouse, so a good mouse uses switches rated for tens of millions of clicks.',
 [['Omron microswitch','A very common type in gaming mice'],['Optical switch','Uses a beam of light instead of a metal contact'],['Silent switch','Makes a much quieter click']],
 [['Lifetime','commonly 20 to 80 million clicks'],['Actuation force','about 50 to 80 g'],['Number','2 to 3 main buttons, and more on gaming mice']],
 'A “double-click” bug appears when an old switch’s metal wears and bounces on the contact, which makes one click register twice.',
 [['kb-keys','Keyboard keys work in a similar way'],['mouse-controller','Reads the button states']]);

inside('mouse','mouse-wheel','Scroll wheel','A wheel whose turning is counted by a light sensor',
 'A small wheel with notches. A light sensor counts how far and which way it turns.',
 'The wheel has slots or spokes and sits between a small infrared LED and a light detector (an optical encoder). As it turns, the spokes block and let through the light, and the detector sees a series of pulses. Two detectors slightly offset from each other show which way it is turning.',
 'The controller counts the pulses to know how many notches you have scrolled, and the order in which the two detectors fire tells it whether you are scrolling up or down. Pressing the wheel down is a third button.',
 'Scrolling is how you move through long pages, and the wheel’s notches (detents) give a clear feel for how far you have gone.',
 [['Notched wheel','Clicks for each step'],['Free-spinning wheel','Spins freely for fast scrolling'],['Tilt wheel','Also reports sideways scrolling']],
 [['Sensor','optical (infrared) encoder'],['Signal','pulses in two channels (quadrature)'],['Extra','the wheel also acts as a middle button']],
 'Two offset sensors are enough to tell direction: if sensor A changes before sensor B, the wheel is turning one way; if B goes first, it turns the other.',
 [['mouse-controller','Counts its pulses'],['mouse-buttons','The wheel can be pressed like a button']]);

inside('mouse','mouse-controller','Controller','Reads everything and reports it to the computer',
 'A small microcontroller that reads the sensor, buttons and wheel and sends reports to the computer.',
 'A microcontroller sits on the mouse’s board. It talks to the optical sensor, reads the buttons and the wheel encoder, and sends the results to the computer through the cable or a wireless radio.',
 'A hundred to a thousand times a second (or more), it sends a short report: how far the mouse moved left-right and up-down, which buttons are down, and how much the wheel turned. The computer moves the pointer by the amount reported.',
 'How often the controller reports (the polling rate) decides how smooth the pointer feels, and how quickly a click reaches the computer.',
 [['USB HID','The standard for mice; needs no driver'],['2.4 GHz wireless','A low-lag radio link with a small receiver'],['Bluetooth','Connects without a receiver']],
 [['Polling rate','125 to 1000 Hz (up to 8000 Hz on some)'],['Report','x and y movement, buttons and wheel'],['Power','5 V from USB, or a battery']],
 'A gaming mouse polling at 1000 Hz sends a new position every millisecond, faster than most screens draw a new frame.',
 [['mouse-sensor','Supplies the movement'],['kb-usb','A keyboard reports to the computer the same way'],['usb','The port a wired mouse plugs into']]);

/* ---------------- Inside the joystick ---------------- */
inside('joystick','joy-stick','Stick and gimbal','The handle and the pivot that tilts in two directions',
 'The handle you move, sitting on a pivot (gimbal) that lets it tilt forward, back, left and right.',
 'A long handle attached to a gimbal: two rings or arms that turn about two directions at right angles to each other. Springs pull the stick back to the centre when you let go.',
 'Tilting the stick forward or back turns one arm, tilting it left or right turns the other. A diagonal tilt turns both. Each arm is attached to a position sensor, so the angle of every tilt is measured separately.',
 'The gimbal is what lets a single stick control two directions at once, smoothly, instead of the four fixed directions of a button pad.',
 [['Flight stick','A stick with a trigger and hat switch for simulators'],['Arcade stick','A short lever with switches at its base'],['Thumbstick','A miniature stick on a game controller']],
 [['Axes','2 (and often a twist as a third)'],['Return','springs to the centre'],['Travel','about ±20° to ±30°']],
 'Real aircraft controls use the same gimbal idea, and early joysticks in flight simulators were copies of a pilot’s control column.',
 [['joy-sensors','Measure the stick’s angle'],['pad-sticks','The same stick idea in a small size']]);

inside('joystick','joy-sensors','Position sensors','Measure how far the stick is tilted',
 'One sensor for each direction that turns the tilt angle into a voltage.',
 'Most joysticks use a potentiometer for each direction: a resistor with a wiper that slides along it. Better ones use Hall-effect sensors, which measure the position of a small magnet without touching it, so they do not wear out.',
 'As the gimbal turns, the wiper slides and the sensor’s voltage changes in proportion to the angle: at the centre it gives half of the supply voltage, and to each side it goes higher or lower. That voltage is a smooth, continuous measurement.',
 'The sensors are what turn a physical movement into an electrical signal the computer can use. Their accuracy decides how precisely small movements register.',
 [['Potentiometer','A variable resistor; cheap, but it wears out'],['Hall-effect sensor','A magnet and a sensor; no contact, no wear'],['Optical sensor','Counts light through a slotted disc']],
 [['Output','a voltage that follows the angle'],['Number','one per axis'],['Wear','potentiometers wear; Hall sensors do not']],
 'A worn-out potentiometer causes “drift”: the stick reports movement when it is at rest, because the wiper’s track has worn unevenly.',
 [['joy-controller','Converts the voltage to numbers'],['joy-stick','Turns the sensors'],['mic-adc','An ADC does the same job for sound']]);

inside('joystick','joy-buttons','Trigger and buttons','Switches on the stick and the base',
 'The trigger, hat switch and buttons, each one a small switch.',
 'A joystick usually has a trigger on the handle and buttons around the grip and base. Each is a small switch, often a rubber dome or a microswitch, that closes a circuit when pressed. A “hat switch” is a small four-way (or eight-way) switch for looking around.',
 'Pressing a button closes its switch and the controller sees a change on one of its inputs. It reports “button 3 pressed” to the computer, and the game decides what that means.',
 'Buttons give a joystick the extra controls a game needs, such as firing, changing view or switching weapon, while the stick itself handles movement.',
 [['Trigger','Fires weapons in flight games'],['Hat switch','Changes the view'],['Throttle','A separate lever that controls speed']],
 [['Type','microswitch or rubber dome'],['Number','from a few to over 20'],['Read as','on or off']],
 'Flight stick makers use the same style of “hat” as real fighter aircraft, so a hand can control many things without leaving the stick.',
 [['joy-controller','Reads their state'],['kb-keys','A keyboard’s switches work in a similar way']]);

inside('joystick','joy-controller','Controller','Turns voltages and buttons into USB data',
 'A small chip that converts the sensors’ voltages to numbers and reports everything to the computer over USB.',
 'A microcontroller with a built-in ADC (analog-to-digital converter). It measures the voltage from each position sensor, reads all the buttons, and sends the result to the computer as a USB game-controller device.',
 'Many times a second, it turns each voltage into a number (for example from 0 to 1023 or 0 to 65,535), adds the button states, and sends a report. The computer reads the numbers and moves the on-screen aircraft or character to match.',
 'This is the point where a smooth, analog movement becomes the digital data a computer needs. Its resolution decides how finely a small movement can be told apart.',
 [['USB HID game controller','Recognised by any operating system'],['10 to 16-bit ADC','Divides the stick’s travel into 1,024 to 65,536 steps'],['Calibration','Sets the centre and the ends of travel']],
 [['Job','ADC, button scan and USB report'],['Resolution','10 to 16 bits per axis'],['Rate','about 125 to 1000 reports a second']],
 'Old PC joysticks connected to a special game port and measured resistance by timing how long a capacitor took to charge.',
 [['joy-sensors','Supplies the voltages'],['mic-adc','A similar converter, used for sound'],['usb','The port it plugs into']]);

/* ---------------- Inside the game controller ---------------- */
inside('gamepad','pad-buttons','Buttons and D-pad','Rubber contacts that press onto the circuit board',
 'The face buttons and the direction pad, each one pressing a rubber contact onto the board.',
 'Under each button is a rubber dome or a rubber pad with a tiny piece of conductive carbon on its underside. The circuit board below has a pair of bare copper contacts. The D-pad is a single cross that rocks to press one of four contacts.',
 'When you press a button, the rubber collapses and its carbon touches both contacts, closing the circuit. The controller sees that connection and reports the press. Letting go lets the rubber spring back and open it.',
 'Rubber contacts are cheap, quiet and light to press, and they give a controller its soft, springy feel. They are also easy to seal against dust and sweat.',
 [['Face buttons','A, B, X, Y (or cross, circle, square, triangle)'],['D-pad','Four-way pad for menus and older-style games'],['Shoulder buttons','Bumpers and triggers on the top edge']],
 [['Type','rubber dome with a carbon pad'],['Number','about 12 to 16 controls'],['Read as','on or off']],
 'The carbon on a worn rubber contact slowly wears off, which is why the oldest buttons on a well-used controller can stop responding.',
 [['pad-controller','Reads every button'],['joy-buttons','Joystick buttons work in a similar way']]);

inside('gamepad','pad-sticks','Thumbsticks','Two small sticks that measure how far you push',
 'Two miniature sticks, each measuring up-down and left-right.',
 'Each thumbstick is a very small version of a joystick: a short stick on a pivot with two position sensors, a spring that returns it to the centre and a button you can press by pushing down on it. Most use small potentiometers; newer ones use Hall-effect or TMR magnetic sensors.',
 'Pushing the stick moves the sensors, and their voltages change in proportion. The controller measures both and reports where the stick is. The left stick usually moves the character and the right one usually moves the camera.',
 'Thumbsticks let a game respond to how much you push, not just which direction: a gentle push walks and a full push runs.',
 [['Potentiometer stick','Common and cheap; can develop drift'],['Hall-effect stick','Magnet-based; no wear from rubbing'],['Clickable stick','Pressing down is another button (L3 / R3)']],
 [['Axes','2 per stick'],['Sensor','potentiometer or Hall effect'],['Travel','about ±15° to ±20°']],
 '“Stick drift” is when the pointer moves on its own: the sensor’s track wears and no longer reads zero at the stick’s centre. Hall-effect sticks were made to avoid it.',
 [['joy-sensors','The same sensors as in a joystick'],['pad-controller','Reads the sensors']]);

inside('gamepad','pad-rumble','Rumble motors','Small motors with an off-centre weight that shake the controller',
 'Two small motors with a lopsided weight on their shafts that make the controller vibrate.',
 'There is usually one motor in each grip. Each has a weight fixed off-centre on its shaft. The two motors differ: the larger one makes strong, low-pitched shakes and the smaller one a fine, high buzz.',
 'When the game asks for vibration, the controller turns on the motors at the strength it is told. As the off-centre weight spins, it wobbles the whole motor, and the controller with it. Different mixes of the two motors give different feelings, such as an engine or an impact.',
 'Vibration is a way to give the player the sense of touch: you feel a collision, a heavy engine or a heartbeat, even though the game is only on the screen.',
 [['Eccentric-mass motor','A weight on a motor shaft; the classic rumble'],['Voice-coil actuator','A sharper, more precise “haptic” vibration'],['Adaptive triggers','Motors that resist your finger on the triggers']],
 [['Number','usually 2 (one in each grip)'],['Type','small DC motors with an off-centre weight'],['Power','a small fraction of a watt']],
 'A motor that is shaking hard is doing so because its weight is deliberately unbalanced: in nearly every other machine, engineers work hard to avoid that.',
 [['pad-controller','Tells them when to shake'],['hdd-spindle','A precisely balanced motor, the opposite of a rumble motor']]);

inside('gamepad','pad-controller','Controller board','The chip, battery and USB or radio link',
 'The main chip that reads every input, drives the motors and talks to the computer.',
 'A small circuit board with a microcontroller, a USB-C port for cable and charging, a Bluetooth or 2.4 GHz radio, and in a wireless controller a rechargeable lithium-ion battery.',
 'The microcontroller reads all the buttons and the sticks’ voltages many times a second, sends a report to the computer, and turns the rumble motors on when it is told to. A wired controller gets its power from the cable; a wireless one from its battery.',
 'This board is what makes a controller a device the computer recognises with no special software. It also decides how quickly a button press reaches the game (the latency).',
 [['Bluetooth controller','Connects to phones, PCs and consoles'],['2.4 GHz wireless','A low-latency link with a small receiver'],['USB-C','A cable for power, data and charging']],
 [['Reads','buttons, two sticks and triggers'],['Link','USB-C, Bluetooth or 2.4 GHz'],['Battery','about 1,000 to 2,000 mAh lithium-ion']],
 'Many controllers send their state to the computer hundreds of times a second, so a button press reaches the game within a few milliseconds.',
 [['pad-buttons','Read by this board'],['pad-sticks','Read by this board'],['kb-controller','A keyboard has a similar microcontroller'],['usb','The port for a wired controller']]);

/* ---------------- Inside the printer (an inkjet) ---------------- */
inside('printer','printer-cartridge','Cartridge and print head','Fires microscopic droplets of ink onto the page',
 'The ink tanks and the print head, whose tiny nozzles fire droplets of ink at the paper.',
 'A cartridge holds the coloured inks (cyan, magenta, yellow and black). Below it is the print head, with hundreds of nozzles thinner than a hair. In a thermal inkjet, each nozzle has a tiny heater.',
 'To fire a droplet, the heater warms the ink for a few millionths of a second. A bubble of vapour forms and pushes a droplet out of the nozzle. Then the bubble collapses and fresh ink is drawn in. Each nozzle can do this thousands of times a second.',
 'Everything you see on the page is made of these droplets. Their tiny size (a few picolitres) is what makes photographs look smooth: the eye cannot pick out the individual dots.',
 [['Thermal inkjet','Heats ink to form a bubble; used by HP and Canon'],['Piezo inkjet','Squeezes ink with a vibrating crystal; used by Epson'],['Ink tank printer','Refillable tanks instead of cartridges']],
 [['Nozzles','hundreds to thousands'],['Droplet','about 1 to 10 picolitres'],['Colours','cyan, magenta, yellow and black (CMYK)']],
 'A picolitre is a millionth of a millionth of a litre: over a million of these droplets would fit into a single drop of water.',
 [['printer-carriage','Moves the head across the page'],['printer-board','Decides which nozzles to fire']]);

inside('printer','printer-carriage','Carriage and belt','Slides the print head back and forth across the page',
 'The carriage that carries the print head, pulled along a rail by a belt and a motor.',
 'The carriage slides along a metal rod across the width of the paper. A toothed belt attached to it loops around a pulley and a small motor. A thin plastic strip with fine markings lets a sensor know exactly where the carriage is.',
 'The motor runs the belt one way and then the other, sweeping the head across the page. The controller fires the nozzles at the right instants as the carriage passes each position, so the dots land exactly where they should.',
 'The head can only print a narrow band at a time. The carriage has to sweep the page many times, so its speed and accuracy set both how fast the printer is and how sharp the print is.',
 [['Belt and pulley','Toothed belt that moves the carriage'],['Encoder strip','A strip of fine lines that tracks the position'],['Stepper or DC motor','Drives the belt']],
 [['Motion','back and forth across the page'],['Accuracy','a small fraction of a millimetre'],['Speed','several passes a second']],
 'The head prints in both directions, going left and going right, and the printer has to line up the two sets of dots to within a tiny fraction of a millimetre.',
 [['printer-cartridge','What it carries'],['printer-rollers','Move the paper between passes']]);

inside('printer','printer-rollers','Paper rollers','Pick up each sheet and move it forward in tiny steps',
 'Rubber rollers that pull a sheet from the tray and move it forward between passes of the print head.',
 'A pickup roller grabs the top sheet of paper from the tray. Feed rollers, driven by a motor through gears, pull it under the print head, with pinch rollers pressing it against them. Exit rollers then push the finished page out.',
 'After each sweep of the print head, the feed rollers advance the paper by exactly one band, a fraction of a millimetre to a few millimetres, so the next sweep starts where the last one ended. A sensor tells the printer when a page starts and when it is jammed.',
 'The paper has to move very precisely: a small error shows up as light or dark lines across the print. It also has to pick up only one sheet at a time.',
 [['Pickup roller','Rubbery, to grip the top sheet'],['Feed roller','Moves the sheet in exact steps'],['Duplex unit','Flips the sheet to print on both sides']],
 [['Step size','a fraction of a millimetre to a few millimetres'],['Drive','a motor and gears'],['Sensors','detect paper and jams']],
 'Paper jams often start at the pickup roller, where two sheets stuck together by static or humidity are pulled in at once.',
 [['printer-carriage','Sweeps the page between advances'],['printer-board','Controls the motor']]);

inside('printer','printer-board','Controller board','Turns the page into a plan of where to put the dots',
 'The board that receives the print job, works out where every dot goes, and controls the motors and nozzles.',
 'A circuit board with a processor, memory and the connections to USB or Wi-Fi. It also has drivers for the motors and the print head, and inputs from the sensors and buttons.',
 'It receives the page from the computer, converts it into a fine grid of dots in each ink colour (rasterising it), and works out which nozzle has to fire when. It runs the carriage and the rollers in step, and watches the sensors for a jam or an empty cartridge.',
 'This board makes the printer do the right thing with almost any document: the same steps turn text, photographs and web pages into patterns of dots.',
 [['Printer driver','Software on the computer that prepares the job'],['Wi-Fi printing','Sends the job over the network instead of a cable'],['Ink level chip','Some cartridges tell the printer how much ink is left']],
 [['Job','rasterise, fire nozzles, run motors'],['Connections','USB, Ethernet and Wi-Fi'],['Language','printer languages such as PCL and PostScript']],
 'A printer’s controller has to turn a whole page into tens of millions of dots, which is why it needs its own processor and memory.',
 [['printer-cartridge','Controlled by this board'],['cpu','A larger processor of the same kind'],['usb','How a wired printer connects']]);

/* ---------------- Inside the webcam ---------------- */
inside('webcam','webcam-lens','Lens','Focuses light from the scene onto the sensor',
 'A small lens that gathers light from the scene and focuses it onto the image sensor.',
 'A tiny stack of two to five plastic or glass lens elements in a small barrel, with an infrared filter that blocks the invisible heat radiation that would wash out colours. Some webcams have an autofocus motor that moves the lens.',
 'Light from each point in the scene passes through the lens and is bent so that it meets again at a single point on the sensor, forming a small, sharp picture there. A wide-angle lens takes in more of the room; a narrow one shows less but larger.',
 'Without a lens, every point of the sensor would receive light from the whole scene, and the result would be a blur. The lens decides how wide the view is and how sharp the picture is.',
 [['Fixed-focus lens','Sharp from about half a metre to far away'],['Autofocus lens','A motor moves the lens to focus'],['Privacy shutter','A slide that covers the lens when not in use']],
 [['Elements','2 to 5 small lenses'],['Field of view','about 60° to 90°'],['Filter','infrared cut filter']],
 'A webcam lens is smaller than a pea, but it has to bend light precisely enough to draw a picture with millions of distinct points.',
 [['webcam-sensor','Where the focused light lands']]);

inside('webcam','webcam-sensor','Image sensor','Millions of light-sensitive pixels that make up the picture',
 'A chip covered with millions of tiny light detectors, one for each pixel of the picture.',
 'A CMOS image sensor is a grid of photodiodes, one for each pixel: a 1080p webcam has about 2 million, a 4K one about 8 million. Each is covered with a small red, green or blue filter (a Bayer pattern), so it sees only one colour.',
 'While the shutter is open, each photodiode collects charge in proportion to the light that falls on it. The sensor then reads the pixels out row by row, turns each charge into a voltage, and converts that into a number. The result is a raw grid of brightness values.',
 'The sensor is the part that turns light into data. A bigger sensor with larger pixels catches more light, which is why webcams look grainy in a dim room.',
 [['CMOS sensor','Used in almost every webcam and phone'],['Rolling shutter','Reads the rows one after another'],['Global shutter','Reads every pixel at the same instant']],
 [['Resolution','2 to 8 megapixels (1080p is about 2.1 MP)'],['Frame rate','30 or 60 frames per second'],['Filter','red, green and blue (Bayer pattern)']],
 'Every pixel on a camera sensor sees only one colour. The full-colour picture is worked out by the processor from its neighbours, a step called demosaicing.',
 [['webcam-lens','Focuses the light on it'],['webcam-isp','Turns its raw values into a picture'],['mouse-sensor','Also a small image sensor']]);

inside('webcam','webcam-isp','Image processor','Turns raw sensor data into a clean video picture',
 'A chip that turns the sensor’s raw values into a colour picture and compresses it.',
 'The image signal processor (ISP) receives the raw data from the sensor. It is often a single chip together with the USB controller.',
 'It reconstructs full colour for every pixel, sets the exposure and white balance automatically, reduces noise, and sharpens the picture. Then it compresses the video, for example to MJPEG or H.264, so that it fits through the USB cable.',
 'Raw sensor data would be too big and too dull to use. The processor is what makes a webcam look natural in different rooms and lights, and what makes streaming video possible over a thin cable.',
 [['Auto exposure','Adjusts the brightness for you'],['Auto white balance','Corrects the colour of the room light'],['MJPEG / H.264','Video compression formats']],
 [['Job','colour, exposure, noise reduction, compression'],['Output','compressed video frames'],['Speed','30 to 60 frames a second']],
 'Uncompressed 1080p video at 30 frames per second is about a gigabit of data every second, far more than USB 2.0 (480 Mbit/s) can carry.',
 [['webcam-sensor','Supplies the raw data'],['webcam-usb','Sends the video on'],['gpu','A larger processor that also handles images']]);

inside('webcam','webcam-usb','USB and LED','Sends the video to the computer and shows when it is on',
 'The USB connection that sends the video and powers the webcam, and the small light that shows when it is on.',
 'A USB cable and a controller that makes the webcam a standard USB video device (a “UVC” camera), so it works on any computer without special software. A small LED beside the lens lights up whenever the sensor is streaming. Many webcams also have a small microphone.',
 'The compressed frames are sent along the cable to the computer, and the operating system passes them to the app that asked for them. The LED is wired so that it lights up whenever the sensor is running.',
 'A standard interface makes webcams plug-and-play. The light is a privacy feature, telling you when a camera is actually recording.',
 [['USB Video Class','The standard that lets any computer use the camera'],['Privacy LED','Lights whenever the camera is on'],['Built-in microphone','A small mic near the lens']],
 [['Standard','USB Video Class (no driver needed)'],['Power','5 V from the USB port'],['Cable','carries video, audio and power']],
 'Some webcams wire the LED to the sensor’s power supply, so that software cannot switch the camera on without the light coming on.',
 [['usb','The port it plugs into'],['webcam-isp','Supplies the video'],['io','Where the cable ends up in the computer']]);
