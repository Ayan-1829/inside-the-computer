/* ==========================================================
   data/devices.js
   Input and output devices connected to the computer.
   `device: 'input' | 'output'` puts a part in the "Connected devices"
   section instead of "Inside it", with a coloured tag.
   Edit the text here, then run: node build/build.mjs
   ========================================================== */

/* ---------------- Output devices ---------------- */
def('monitor',{name:'Monitor',parent:'computer',level:2,device:'output',tip:'Output device: shows the picture',
 short:'The screen that shows everything the computer produces.',
 what:'A monitor is a display made of millions of pixels, each built from red, green and blue subpixels. Most are LCD panels lit by a backlight; OLED panels make light in every pixel directly.',
 does:'It receives a video signal from the graphics card over HDMI or DisplayPort and redraws the whole picture many times a second. That rate is called the refresh rate.',
 why:'Resolution decides how sharp things look, refresh rate how smooth motion feels, and response time how blurry fast movement gets.',
 ex:[['Dell UltraSharp','Office and design monitors'],['LG UltraGear','Gaming monitors, 144 Hz and up'],['Samsung Odyssey','Curved and OLED gaming monitors'],['Apple Studio Display','5K display for Macs']],
 specs:[['Resolution','1920 × 1080 (Full HD) to 3840 × 2160 (4K)'],['Refresh rate','60–360 Hz'],['Panel types','IPS, VA, TN, OLED'],['Connection','HDMI, DisplayPort, USB-C']],
 fact:'A 4K monitor has about 8.3 million pixels and almost 25 million subpixels, each set to the right brightness many times every second.',
 rel:[['display-outputs','Plugs into the graphics card'],['video-out','Or into the motherboard’s video ports'],['gpu','Draws every frame it shows']]});

def('speakers',{name:'Speakers',parent:'computer',level:2,device:'output',tip:'Output device: plays sound',
 short:'Turn the computer’s electrical sound signals into sound waves you can hear.',
 what:'A speaker has a coil attached to a paper or plastic cone, sitting in the field of a magnet. Current through the coil pushes the cone back and forth, which pushes the air.',
 does:'The computer’s audio chip converts digital sound into an analog signal with a DAC (digital-to-analog converter). The signal is amplified and sent to the speakers or headphones.',
 why:'Sound gives feedback, alerts and immersion in games, video calls and music.',
 ex:[['Stereo desktop speakers','Left and right channels'],['2.1 systems','Two speakers plus a subwoofer for bass'],['Headphones','Tiny speakers next to your ears'],['USB speakers','Contain their own DAC']],
 specs:[['Human hearing','about 20 Hz to 20 kHz'],['Connection','3.5 mm jack, USB, Bluetooth, optical'],['Power','a few watts to over 100 W']],
 fact:'CD-quality audio stores 44,100 samples per second for each channel, just over twice the highest pitch humans can hear.',
 rel:[['audio','Plug into the audio jacks'],['usb','Or connect over USB']]});

def('printer',{name:'Printer',parent:'computer',level:2,device:'output',tip:'Output device: puts pages on paper',
 short:'Puts text and images from the computer onto paper.',
 what:'Inkjet printers spray tiny droplets of ink. Laser printers use a laser and static electricity to place powdered toner on the paper, then melt it in place with heat.',
 does:'The computer sends each page as data over USB, Wi-Fi or the network. The printer’s own processor works out where every dot should go.',
 why:'Printers turn digital documents into physical copies for forms, photos and schoolwork.',
 ex:[['HP LaserJet','Laser printers'],['Epson EcoTank','Inkjet with refillable ink tanks'],['Canon PIXMA','Home inkjet printers'],['3D printers','Build objects layer by layer']],
 specs:[['Resolution','about 600–4,800 dots per inch'],['Speed','roughly 10–40 pages per minute'],['Connection','USB, Wi-Fi, Ethernet']],
 fact:'An inkjet printhead has hundreds of nozzles, each firing droplets only a few picolitres in size, thousands of times per second.',
 rel:[['usb','Often connects by USB'],['ethernet','Office printers join the network']]});

/* ---------------- Input devices ---------------- */
def('keyboard',{name:'Keyboard',parent:'computer',level:2,device:'input',tip:'Input device: types text and commands',
 short:'The main way to type text and commands into the computer.',
 what:'A keyboard is a grid of switches, one under each key. A small controller chip inside scans the grid many times a second to see which keys are pressed.',
 does:'When you press a key it sends a code to the computer over USB or Bluetooth. The operating system turns that code into a character according to your language layout.',
 why:'It is still the fastest way for most people to enter text, and keyboard shortcuts speed up almost every task.',
 ex:[['Membrane keyboards','Quiet and cheap, with rubber domes under the keys'],['Mechanical keyboards','A separate switch under every key'],['Logitech MX Keys','Popular office keyboard'],['Laptop keyboards','Low-profile scissor switches']],
 specs:[['Keys','about 104–108 on a full-size layout'],['Polling rate','125–1,000 Hz, higher on some gaming models'],['Connection','USB, Bluetooth, 2.4 GHz wireless']],
 fact:'Cheap keyboards can miss some combinations of three or more keys held together. Gaming keyboards advertise “n-key rollover”, meaning every key is detected no matter how many are pressed.',
 rel:[['usb','Plugs into a USB port'],['cpu','Each key press becomes an interrupt the CPU handles']]});

def('mouse',{name:'Mouse',parent:'computer',level:2,device:'input',tip:'Input device: moves the pointer',
 short:'A pointing device that moves the on-screen pointer and clicks on things.',
 what:'Modern mice use a tiny optical sensor, like a very fast low-resolution camera, that takes thousands of pictures of the surface beneath it every second.',
 does:'A chip compares the pictures to work out how far the mouse has moved, and sends the movement and button clicks to the computer, which moves the pointer.',
 why:'Pointing and clicking made computers usable by people who do not want to type commands.',
 ex:[['Logitech MX Master','Office mouse'],['Razer DeathAdder','Gaming mouse'],['Apple Magic Mouse','Touch-sensitive top surface'],['Trackball','Stays still while you roll the ball']],
 specs:[['Sensor resolution','about 800–30,000 DPI'],['Polling rate','125–8,000 Hz'],['Connection','USB, Bluetooth, 2.4 GHz wireless']],
 fact:'Douglas Engelbart demonstrated the first computer mouse, a wooden box with two wheels, in his famous 1968 “Mother of All Demos”.',
 rel:[['usb','Plugs into a USB port'],['monitor','Moves the pointer you see on it']]});

def('joystick',{name:'Joystick',parent:'computer',level:2,device:'input',tip:'Input device: stick for games and simulators',
 short:'A tilting stick that gives smooth, precise control in games and simulators.',
 what:'A joystick is a stick that pivots on a base, with buttons on the handle and base. Sensors measure how far it is tilted along each axis.',
 does:'Its position is read as analog values, from potentiometers or Hall-effect magnetic sensors, converted into numbers and sent over USB many times a second.',
 why:'Joysticks give proportional control: tilt a little for a small movement, a lot for a big one. That suits flight simulators, space games, and machines such as cranes and powered wheelchairs.',
 ex:[['Thrustmaster T.16000M','Flight-simulator joystick'],['Logitech Extreme 3D Pro','Popular budget joystick'],['HOTAS setups','Separate stick and throttle for flight sims']],
 specs:[['Axes','usually 2–4 (left-right, forward-back, twist, throttle)'],['Sensors','potentiometers or Hall-effect sensors'],['Connection','USB']],
 fact:'Hall-effect joysticks measure a magnet’s position without touching it, so they do not wear out and drift the way older sliding-contact sensors can.',
 rel:[['usb','Plugs into a USB port'],['gamepad','A two-handed alternative']]});

def('gamepad',{name:'Game controller',parent:'computer',level:2,device:'input',tip:'Input device: two-handed gamepad',
 short:'A two-handed controller with thumbsticks, triggers and buttons, used for games.',
 what:'A game controller, or gamepad, combines two thumbsticks, a direction pad, analog triggers and a set of buttons in a shape made to be held in both hands.',
 does:'It reports stick positions, trigger pressure and button presses to the computer, and receives signals back that make it vibrate.',
 why:'Controllers make many games more comfortable than a keyboard and mouse, and are standard for console-style games on PC.',
 ex:[['Xbox Wireless Controller','Widely supported on Windows'],['Sony DualSense','PlayStation 5 controller, also works on PC'],['8BitDo','Retro-style controllers']],
 specs:[['Inputs','2 thumbsticks, D-pad, 2 analog triggers, 10+ buttons'],['Feedback','vibration, adaptive triggers on some'],['Connection','USB, Bluetooth, wireless adapter']],
 fact:'Because a controller also receives data to drive its vibration motors and lights, it is technically both an input and an output device.',
 rel:[['usb','Connects by USB or Bluetooth'],['joystick','A single-stick alternative']]});

def('webcam',{name:'Webcam',parent:'computer',level:2,device:'input',tip:'Input device: camera for video calls',
 short:'A small camera that sends live video to the computer.',
 what:'A webcam is a small digital camera with a lens, an image sensor (usually CMOS) and often a built-in microphone.',
 does:'The sensor captures many frames per second, a chip compresses them, and they are sent over USB to the computer for video calls, streaming or recording.',
 why:'Webcams made video calls, online classes and live streaming possible from any desk.',
 ex:[['Logitech C920','Popular 1080p webcam'],['Laptop cameras','Built into the screen bezel'],['Windows Hello cameras','Infrared cameras for face sign-in']],
 specs:[['Resolution','720p to 4K'],['Frame rate','30 or 60 frames per second'],['Connection','USB']],
 fact:'Each pixel on a camera sensor sees only one colour through a tiny filter. The full-colour image is rebuilt by software from a mosaic of red, green and blue pixels, called a Bayer filter.',
 rel:[['usb','Plugs into a USB port'],['monitor','Usually sits on top of it']]});

def('mic',{name:'Microphone',parent:'computer',level:2,device:'input',tip:'Input device: turns sound into an electrical signal',
 short:'Turns sound waves into an electrical signal the computer can record or transmit.',
 what:'A microphone has a thin diaphragm that vibrates with incoming sound. Most desk mics are condenser or dynamic types, built into a capsule on a small stand.',
 does:'The diaphragm’s vibration is turned into a tiny electrical signal, which an ADC (analog-to-digital converter) samples into digital audio for calls, recordings and voice assistants.',
 why:'A clear microphone is what makes video calls, streaming, voice chat and voice commands understandable on the other end.',
 ex:[['USB desk mic','Popular for streaming and calls'],['Headset mic','Built into a gaming or call headset'],['Laptop mic array','Small mics built into the bezel']],
 specs:[['Types','Condenser (sensitive) or dynamic (rugged)'],['Connection','USB, 3.5 mm jack, or built-in'],['Pickup pattern','Cardioid (front), omnidirectional, or stereo']],
 fact:'A condenser microphone needs a small voltage, called phantom power, to charge its capsule — without it, the mic stays silent even though everything else is plugged in correctly.',
 rel:[['usb','Plugs into a USB port'],['webcam','Often built into the same device'],['speakers','The output equivalent']]});
