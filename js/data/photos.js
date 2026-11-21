/* ==========================================================
   data/photos.js
   Real photographs for the parts that have a picture of their own: first the
   part as you would see it, then what it looks like opened up or taken apart. All are from Wikimedia
   Commons under free licences, credited where they are shown.
   PHOTOS[id] = [[file in img/photos/, width, height, caption, author, licence, licence URL, source page], …]
   ========================================================== */
var PHOTOS = {
  "webcam": [
    ["webcam-out-2.jpg", 900, 506, "A USB webcam, clipped to the top of a monitor.", "WrS.tm.pl", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/", "https://commons.wikimedia.org/wiki/File:USB_webcam_for_PC.jpg"],
    ["webcam-0.jpg", 900, 506, "Inside a webcam: the lens (right) and the image processor chip (left) on the camera board.", "Raimond Spekking", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Acer_TravelMate_P253-M-32344G50Maks_-_Webcam_module_-_Sunplus_SPCA2062B-0135.jpg"],
    ["webcam-11.jpg", 900, 506, "A camera module taken apart: the lens, its focusing coil and the image sensor.", "Raimond Spekking", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Samsung_SGH-D880_-_camera_exploded-0920.jpg"]],
  "mic": [
    ["mic-5.jpg", 900, 245, "A microphone.", "Nikolai Beier", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:DPA_dfacto_Vocal_wired_first_edition.jpg"],
    ["mic-inside-3.jpg", 900, 506, "A microphone module opened up: the grille, the capsule inside its foam, and the small circuit board behind it.", "Raimond Spekking", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Blaupunkt_CR-4500_-_microphone_module-9569.jpg"],
    ["mic-parts-0.jpg", 900, 675, "A handheld microphone taken apart: grille, capsule, body and cable.", "Dmitry G", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Disassembled_Oktava_microphone.JPG"],
    ["mic-3.jpg", 900, 692, "Electret microphone capsules, the kind inside most computer and headset microphones.", "a Wikimedia Commons contributor", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Electret_condenser_microphone_capsules.jpg"]],
  "speakers": [
    ["speakers-5.jpg", 900, 590, "A pair of USB computer speakers.", "Evan-Amos", "Public domain", "", "https://commons.wikimedia.org/wiki/File:Logitech-usb-speakers.jpg"],
    ["speaker-9.jpg", 900, 610, "The back of a speaker driver: the magnet and the metal frame that holds the cone.", "Mister rf", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:P21653A_loudspeaker_-_back_side_view.jpg"],
    ["speaker-0.jpg", 900, 877, "The voice coil. Current through it pushes against the magnet and moves the cone.", "Peter Hebels", "Public domain", "", "https://commons.wikimedia.org/wiki/File:Voicecoil_of_large_speaker.jpg"]],
  "keyboard": [
    ["keyboard-out-3.jpg", 900, 343, "A computer keyboard.", "D-Kuru", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Razer_Ornata_Chroma_keyboard-top_PNr%C2%B00463.jpg"],
    ["keyboard-2.jpg", 900, 506, "Inside a keyboard: the membrane sheets with a contact under every key, and the controller board.", "Deskthority user Tuxsavvy", "Public domain", "", "https://commons.wikimedia.org/wiki/File:APC_membrane_switch_(Type_III)_-_controller.jpg"],
    ["keyboard-0.jpg", 900, 656, "The rubber domes under the keys. Pressing one pushes the membrane contacts together.", "Asiir at English Wikipedia", "CC BY-SA 2.5", "https://creativecommons.org/licenses/by-sa/2.5/", "https://commons.wikimedia.org/wiki/File:Membrane_keyboard.jpg"]],
  "mouse": [
    ["mouse-out-3.jpg", 900, 596, "A wired computer mouse.", "Raysonho @ Open Grid Scheduler / Grid Engine", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/", "https://commons.wikimedia.org/wiki/File:ComputerMouseCloseup3.jpg"],
    ["mouse-6.jpg", 900, 675, "Inside an optical mouse: the scroll wheel, the buttons and the sensor board.", "Kent Madsen", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Disassembled,_rival_optical_mouse,_steelseries,_bottom.jpg"],
    ["mouse-11.jpg", 900, 506, "The optical sensor chip and its lens, which watch the desk surface move.", "Raimond Spekking", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Logitech_M210_-_LED,_lens_and_optical_mouse_sensor-2426.jpg"]],
  "monitor": [
    ["monitor-11.jpg", 818, 900, "An LCD monitor.", "Zzubnik; derivative work by AGreue", "Public domain", "", "https://commons.wikimedia.org/wiki/File:Computer_monitor_remix_transparent.png"],
    ["monitor-in-2.jpg", 900, 619, "The LCD panel taken out of a monitor, with its driver boards along the top edge.", "Raimond Spekking", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Acer_Extensa_5220_-_AU_Optronics_B154EW02-4911.jpg"],
    ["monitor-in-6.jpg", 900, 498, "The backlight of an older monitor: lamps behind the panel that shine through the pixels.", "Raimond Spekking", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Chi_Mei_V315B1-L05_-_fluorescent_lamps_backlit-0380.jpg"]],
  "printer": [
    ["printer-out-11.jpg", 900, 675, "An inkjet printer.", "3dball at Chinese Wikipedia", "Public domain", "", "https://commons.wikimedia.org/wiki/File:Hp_business_inkjet_3000.jpg"],
    ["printer-1.jpg", 900, 675, "Inside an inkjet printer: the carriage that carries the ink cartridges along its rail.", "Klosito", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Inkjet_printer_No_case,_front_side.JPG"],
    ["printer-5.jpg", 900, 675, "Print heads and ink cartridges: cyan, magenta, yellow and black.", "DMahalko", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:HP_Business_Inkjet_1200n_-_Continuous_Ink_System_-_Printhead_cover_open.jpg"]],
  "joystick": [
    ["joystick-11.jpg", 900, 675, "A flight joystick for a computer.", "Wesha", "CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/", "https://commons.wikimedia.org/wiki/File:Saitek_Aviator_Joystick_-_1.jpg"],
    ["joystick-4.jpg", 900, 900, "An analogue stick: two potentiometers measure left–right and forward–back.", "Raimond Spekking", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:PDP_Afterglow_PL-3702_for_Xbox_360_-_Joystick_potentiometer-8607.jpg"]],
  "gamepad": [
    ["gamepad-out-1.jpg", 900, 820, "A game controller (Xbox 360).", "Evan-Amos", "Public domain", "", "https://commons.wikimedia.org/wiki/File:Xbox-360-Wireless-Controller-White.jpg"],
    ["gamepad-2.jpg", 900, 675, "Inside a game controller: the circuit board, its controller chip and the button contacts.", "Eoin Houston", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Gamecontrollerinternal.jpg"],
    ["gamepad-4.jpg", 900, 600, "A controller taken apart: the board, the rubber button pads and the case.", "Multicherry", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:200_in_1_Famiclone_Retro_Mini_Controller_(disassembled_view_2).jpg"]],
  "cpu": [
    ["cpu-4.jpg", 900, 506, "Desktop processors. The chip itself is under the metal lid.", "Мой Компьютер", "CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/", "https://commons.wikimedia.org/wiki/File:14-%D1%8B%D0%B9_%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%BB_Intel_%D0%97%D0%B0%D1%87%D0%B5%D0%BC_%D0%BF%D0%BE%D1%8F%D0%B2%D0%B8%D0%BB%D0%B8%D1%81%D1%8C_14900K,_14700K_%D0%B8_14600K-00.16.50.016_(%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80).png"],
    ["cpu-6.jpg", 900, 675, "A map of a real processor die: four cores, shared cache, graphics and the memory controller.", "Intel in Deutschland", "CC BY-SA 2.0", "https://creativecommons.org/licenses/by-sa/2.0/", "https://commons.wikimedia.org/wiki/File:4th_Generation_Intel%C2%AE_Core%E2%84%A2_Processor_Die_Map.jpg"]],
  "motherboard": [
    ["motherboard-6.jpg", 826, 900, "A motherboard (micro-ATX): CPU socket, RAM slots, expansion slots and connectors.", "Jacek Halicki", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:2023_P%C5%82yta_g%C5%82%C3%B3wna_ASRock_A320M-DVS.jpg"],
    ["motherboard-4.jpg", 748, 900, "A modern ATX motherboard.", "Jacek Halicki", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:2023_P%C5%82yta_g%C5%82%C3%B3wna_Asus_ROG_STRIX_Z690-A_GAMING_WIFI.jpg"]],
  "ram": [
    ["ram-0.jpg", 900, 345, "A DDR4 RAM module, as it is sold, with its heat spreader.", "ElooKoN", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:RAM_Module_(SDRAM-DDR4).jpg"],
    ["ram-1.jpg", 900, 218, "The same kind of module without a heat spreader: the black chips are the memory.", "PantheraLeo1359531", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/", "https://commons.wikimedia.org/wiki/File:16_GiB-DDR4-RAM-Riegel_RAM019FIX_Small_Crop_90_PCNT.png"]],
  "gpu": [
    ["gpu-3.jpg", 900, 653, "A graphics card with its fan and outputs.", "Gary Houston", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/", "https://commons.wikimedia.org/wiki/File:MSI_GeForce_GT_1030_2G_LP_OC_Graphics_Card_20200604-001.jpg"],
    ["gpu-2.jpg", 900, 632, "A graphics card without its cooler: the GPU chip in the middle, memory chips around it.", "Mentalist", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/", "https://commons.wikimedia.org/wiki/File:Club3D_S3_Deltachrome_S8_card_without_cooler.jpg"]],
  "psu": [
    ["psu-6.jpg", 875, 900, "A computer power supply, with its fan and power socket.", "Raffaele Aquilante", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/", "https://commons.wikimedia.org/wiki/File:Alimentatore.jpg"],
    ["psu-2.jpg", 900, 531, "Inside a power supply: transformers, coils, capacitors and heat sinks.", "Hans Haase", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:HEC-120_PCB_original_condition_open_IMG_8275.jpg"]],
  "cooling": [
    ["cooling-5.jpg", 791, 900, "A tower CPU cooler: copper heat pipes, aluminium fins and a fan.", "osman gucel", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/", "https://commons.wikimedia.org/wiki/File:Cooler_Master_Hyper_212_EVO_-_CPU_Cooler_with_120mm_PWM_Fan_(RR-212E-20PK-R2).jpg"],
    ["cooling-3.jpg", 900, 893, "Heat pipes carry the heat from the CPU up into the fins.", "Hannes Grobe", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:CPU-cooler-08_hg.jpg"]],
  "io": [
    ["io-0.jpg", 900, 264, "The back of a computer: the I/O panel with USB, video, network and audio ports.", "Fabexplosive", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:ZotacION2.jpg"]],
  "ssd": [
    ["ssd-0.jpg", 900, 321, "An M.2 NVMe SSD.", "D-Kuru", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Samsung_980_PRO_PCIe_4.0_NVMe_SSD_1TB-top_PNr%C2%B00915.jpg"],
    ["ssd-6.jpg", 900, 581, "Inside a SATA SSD: the controller chip and the flash memory chips.", "MatteX", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/", "https://commons.wikimedia.org/wiki/File:Samsung_SSD_840_120GB_MZ-7TD120--6_BOARD_TOP.JPG"]],
  "hdd": [
    ["hdd-out-9.jpg", 900, 506, "A 3.5-inch hard drive, closed, as it sits inside a computer.", "Grind24", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Seagate_DB35.2_Consumer_Storage_hard_disk.jpg"],
    ["hdd-4.jpg", 900, 600, "An opened hard drive: the platter, and the arm with the read/write head.", "Mk2010", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/", "https://commons.wikimedia.org/wiki/File:Hard_disk_drive_platter,_Western_Digital_Caviar_250Gb_WD2500AAKS.jpg"],
    ["hdd-11.jpg", 900, 600, "The read/write head flying over the platter.", "Eric Gaba (Sting)", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Seagate_ST33232A_hard_disk_head_and_platters_detail.jpg"]],
  "storage": [
    ["ssd-0.jpg", 900, 321, "An M.2 NVMe SSD.", "D-Kuru", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", "https://commons.wikimedia.org/wiki/File:Samsung_980_PRO_PCIe_4.0_NVMe_SSD_1TB-top_PNr%C2%B00915.jpg"],
    ["ssd-6.jpg", 900, 581, "Inside a SATA SSD: the controller chip and the flash memory chips.", "MatteX", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/", "https://commons.wikimedia.org/wiki/File:Samsung_SSD_840_120GB_MZ-7TD120--6_BOARD_TOP.JPG"],
    ["hdd-out-9.jpg", 900, 506, "A 3.5-inch hard drive, closed, as it sits inside a computer.", "Grind24", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/", "https://commons.wikimedia.org/wiki/File:Seagate_DB35.2_Consumer_Storage_hard_disk.jpg"],
    ["hdd-4.jpg", 900, 600, "An opened hard drive: the platter, and the arm with the read/write head.", "Mk2010", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/", "https://commons.wikimedia.org/wiki/File:Hard_disk_drive_platter,_Western_Digital_Caviar_250Gb_WD2500AAKS.jpg"]],
  "computer": [
    ["computer-1.jpg",895,900,"A desktop computer: the tower (the system unit) with its monitor, keyboard and mouse.","Terraflorin","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Terraflorin_PC.jpg"],
    ["computer-2.jpg",900,675,"A tower with its side panel off: the motherboard with a large CPU cooler, the memory, and the power supply at the bottom.","Bretwa","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:ATX_computer_case_-_left_-_2018-05-18.jpg"]],
  "power-button": [
    ["power-button-1.jpg",508,900,"The front of a computer case: the power button, the smaller reset button and the power light.","Gerolsteiner91 (Niklas Bildhauer)","CC BY-SA 2.5","https://creativecommons.org/licenses/by-sa/2.5","https://commons.wikimedia.org/wiki/File:Computer-frontbuttons.JPG"],
    ["power-button-2.jpg",675,900,"The power button and lights on the front panel of a tower.","William Hook","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:Antec_P182_-_Power_and_LEDs.jpg"]],
  "cpu-socket": [
    ["cpu-socket-1.jpg",830,900,"An empty CPU socket (LGA 1700): hundreds of tiny spring contacts under a metal frame and lever.","Jacek Halicki","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:2023_Podstawka_LGA_1700.jpg"],
    ["cpu-socket-2.jpg",900,515,"A CPU next to its socket. The flat pads under the processor press down onto the spring contacts.","Pathfinbird","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Intel_Core_i5-13600KF_with_LGA_1700_socket.jpg"]],
  "ram-slots": [
    ["ram-slots-1.jpg",900,372,"Four DIMM slots on a motherboard. A notch in each slot only lets the right kind of memory module in.","Project Kei","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Four_SDRAM_DIMM_slots_on_a_computer_motherboard.jpg"]],
  "chipset": [
    ["chipset-1.jpg",900,603,"The chipset (an Intel Platform Controller Hub) on a motherboard, with its heat sink taken off.","Jpogi","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Intel_DH82H81_PCH.JPG"],
    ["chipset-2.jpg",900,720,"An older chipset chip, a VIA southbridge, which ran the disks, USB and sound.","MOS6502","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:Southbridge_VIA_VT82C686A.jpg"]],
  "pcie": [
    ["pcie-1.jpg",900,675,"PCI Express slots on a motherboard. Longer slots have more lanes, for faster cards such as graphics cards.","Mixabest","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:ASUS_P8H67_00282.JPG"]],
  "vrm": [
    ["vrm-1.jpg",900,462,"The CPU’s voltage regulators on a motherboard: a row of chokes (coils), with the power transistors under the heat sinks.","Dsimic","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Voltage_regulator_module_on_a_computer_motherboard.jpg"],
    ["vrm-2.jpg",900,792,"Voltage regulators around a CPU socket. Each phase has a choke and transistors; together they turn 12 V into about 1 V for the CPU.","StefanEnDev","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:Voltage_regulator_module_for_a_modern_Gigabyte_Aorus_X570_motherboard_running_on_socket_AM4.jpg"]],
  "bios": [
    ["bios-1.jpg",900,620,"BIOS chips from older motherboards. The firmware that starts the computer is stored in chips like these.","davidsonfrancis","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:BIOSes_-_52786217058.jpg"],
    ["bios-2.jpg",900,900,"Newer boards keep their firmware in a small 8-pin serial flash chip like this Winbond 25Q16.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:H-L_Data_Storage_GT60N_-_board_-_Winbond_25Q16CVSIG-9332.jpg"]],
  "cmos": [
    ["cmos-1.jpg",900,675,"The CMOS battery in its holder on a motherboard. It keeps the clock running and the settings saved while the computer is unplugged.","Kent Madsen","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:CMOS_Battery,_Motherboard.jpg"]],
  "rear-io": [
    ["rear-io-1.jpg",900,247,"The rear connectors of an older motherboard: PS/2 keyboard and mouse, network, USB, VGA video and sound, plus the old serial, parallel and game ports.","JulianVilla26","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Back_Panel_Connectors_PCChips_M925LR_Motherboard.jpg"],
    ["io-0.jpg",900,264,"The back of a computer: the I/O panel with USB, video, network and audio ports.","Fabexplosive","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:ZotacION2.jpg"]],
  "atx-power": [
    ["atx-power-1.jpg",900,667,"The 24-pin ATX plug at the end of the power supply’s main cable. Four of its pins can be split off for older 20-pin boards.","Dsimic","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:24-pin_ATX_power_plug_from_a_Seasonic_PSU_20131105.jpg"],
    ["atx-power-2.jpg",900,675,"The 24-pin power socket on a motherboard (white), above an older IDE disk connector (blue).","The Perfectionnist","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:IDE_ATX24.jpg"]],
  "sata-ports": [
    ["sata-ports-1.jpg",658,900,"SATA ports on a motherboard, and a SATA data cable. Each port connects one drive.","Berkut","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:SATA_ports.jpg"]],
  "dram": [
    ["dram-1.jpg",900,506,"A DRAM chip on a circuit board: this Samsung chip holds 512 megabits of DDR2 memory.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Cisco_EPC3212_-_Samsung_K4T51163QI-HCE6-8773.jpg"],
    ["dram-2.jpg",900,611,"Inside a DRAM chip: the silicon die of a 64-megabit DDR memory. The large, evenly patterned blocks are its memory arrays.","Fritzchens Fritz","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:SAMSUNG@DDR-SDRAM@64MBit@K4D62323HA-QC60_Stack-DSC03539-DSC03556_-_ZS-DMap.jpg"]],
  "sram": [
    ["sram-1.jpg",900,541,"An SRAM chip (a 6116, 2 KB). Static RAM keeps each bit in a small latch, so it never needs refreshing.","Satyamfifa","Public domain","","https://commons.wikimedia.org/wiki/File:Hyundai_RAM_HY6116AP-10.jpg"]],
  "spd": [
    ["spd-1.jpg",900,900,"A 24C02 EEPROM: the same kind of tiny memory chip that stores a memory module’s SPD data (its size, speed and timings).","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Hewlett-Packard_DeskJet_710C_-_controller_board_-_STMicroelectronis_24C02-7811.jpg"]],
  "compute-units": [
    ["compute-units-1.jpg",819,900,"The silicon die of a graphics chip (ATI RV670). The repeated blocks are its arrays of shader cores.","Martijn Boer","Public domain","","https://commons.wikimedia.org/wiki/File:ATI_RV670_die_shot_-_27808928717.jpg"],
    ["compute-units-2.jpg",900,568,"Another graphics die (ATI R580+), photographed at an angle. A GPU is built from many copies of the same small processor.","Martijn Boer","Public domain","","https://commons.wikimedia.org/wiki/File:ATi_R580%2B_die_shot_-_41592683805.jpg"]],
  "vram": [
    ["vram-chip-1.jpg",900,675,"A GDDR5 memory chip on a graphics card, one of several around the GPU.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Palit_GeForce_GTX_750_StormX_OC_-_SK_Hynix_H5GC2H24BFR-T2C-0219.jpg"],
    ["gpu-2.jpg",900,632,"A graphics card without its cooler: the GPU chip in the middle, memory chips around it.","Mentalist","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:Club3D_S3_Deltachrome_S8_card_without_cooler.jpg"]],
  "display-outputs": [
    ["display-outputs-1.jpg",900,600,"The outputs of a graphics card: DisplayPort, HDMI and DVI connectors on its metal bracket.","MiNe","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:EVGA_02G-P4-2966-KR_outputs_20150129.jpg"]],
  "m2-connector": [
    ["m2-connector-1.jpg",900,506,"An M.2 SSD in its slot on a motherboard. The card plugs in at one end and is held down by a single screw.","Ilya Plekhanov","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Samsung_960_EVO_in_M.2_slot_01.jpg"]],
  "ssd-controller": [
    ["ssd-controller-1.jpg",900,675,"Inside an SSD (Samsung 860 Pro): the controller in the middle runs the drive, with its DRAM cache on the left and a flash memory chip on the right.","Michael Bemmerl","CC BY 3.0 DE","https://creativecommons.org/licenses/by/3.0/de/deed.en","https://commons.wikimedia.org/wiki/File:Samsung_SSD_860_Pro_internal_bottom.jpg"]],
  "dram-cache": [
    ["ssd-controller-1.jpg",900,675,"The same SSD board: the chip on the left is DRAM, the drive’s fast cache. The controller is in the middle and the flash memory on the right.","Michael Bemmerl","CC BY 3.0 DE","https://creativecommons.org/licenses/by/3.0/de/deed.en","https://commons.wikimedia.org/wiki/File:Samsung_SSD_860_Pro_internal_bottom.jpg"]],
  "nand-flash": [
    ["nand-flash-1.jpg",900,560,"A NAND flash memory chip (Samsung, 64 MB) in a 48-pin package. SSDs and USB sticks are built from chips like it.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:K9F1208U0B.jpg"]],
  "hdd-platter": [
    ["hdd-platter-1.jpg",900,690,"Two hard disk platters: a large one from an old drive and a small one from a modern 3.5-inch drive. Each is a disc coated with magnetic material.","Friedrich Haag","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Gro%C3%9F_und_klein_001_2022_07_12.jpg"],
    ["hdd-platter-2.jpg",900,600,"A stack of platters on one spindle. The marks on the top one are from a head crash, where a head touched the surface.","Alchemist-hp","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Hard_disk_head_crash.jpg"]],
  "hdd-head": [
    ["hdd-head-1.jpg",477,900,"Read/write heads at the tip of the arms, close up. Each side of each platter has a head of its own.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Seagate_Cheetah_10K.7_Disk_Read_Write_Head_details_01.jpg"],
    ["hdd-11.jpg",900,600,"The read/write head flying over the platter.","Eric Gaba (Sting)","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:Seagate_ST33232A_hard_disk_head_and_platters_detail.jpg"]],
  "hdd-arm": [
    ["hdd-arm-1.jpg",900,600,"The actuator arm assembly taken out of a hard drive: the arms with their heads, the pivot, and the voice coil that swings them.","Mk2010","CC BY 4.0","https://creativecommons.org/licenses/by/4.0","https://commons.wikimedia.org/wiki/File:Actuator_arm_assembly_of_a_hard_disk_drive.jpg"],
    ["hdd-arm-2.jpg",900,675,"The actuator arm in place over the platters, with the flexible cable that carries the heads’ signals.","Crispin Semmens","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:Actuator_arm_(1570000726).jpg"]],
  "hdd-spindle": [
    ["hdd-spindle-1.jpg",900,675,"The spindle motor of a hard drive. The platters are clamped onto it and spin at thousands of revolutions a minute.","Share Bear","Public domain","","https://commons.wikimedia.org/wiki/File:Hard_Drive_Spindle_Motor_Top.jpg"],
    ["hdd-spindle-2.jpg",900,675,"The same spindle motor from below.","Share Bear","Public domain","","https://commons.wikimedia.org/wiki/File:Hard_Drive_Spindle_Motor_Bottom.jpg"]],
  "hdd-controller-board": [
    ["hdd-controller-board-1.jpg",900,624,"The controller board of a laptop hard drive: its chips run the motor and the heads and talk to the computer.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Toshiba_MK2326FC_-_hard_disk_controller.jpg"],
    ["hdd-controller-board-2.jpg",900,675,"The controller board of a desktop hard drive (WD Caviar Green).","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:WD_Caviar_Green_WD10EADS_-_Controller-91995.jpg"]],
  "rectifier": [
    ["rectifier-1.jpg",900,787,"A bridge rectifier: four diodes in one package, marked ~ for the AC in and + and – for the DC out.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:3PM1_Bridge_rectifier.jpg"]],
  "filter-caps": [
    ["filter-caps-1.jpg",900,842,"The big filter capacitor of a power supply (220 µF, 450 V). It smooths the rectified mains voltage.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Xerox_WorkCentre_6605_-_power_supply_board_-_Nippon_Chemi-Con_aluminum_electrolytic_capacitor_220%C2%B5F,_450V-8667.jpg"],
    ["filter-caps-2.jpg",900,675,"Electrolytic capacitors of different sizes, taken from an old computer power supply and a DVD drive.","KiwiJoghurt","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Various_electrolytic_capacitors.jpg"]],
  "transformer": [
    ["transformer-1.jpg",900,600,"Two switch-mode power supply boards. The yellow-taped parts are their ferrite transformers, small because they work at a high frequency.","Retired electrician","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:24V3A_and_24V9A_AC-DC_SMPS_boards_08(DXO).jpg"]],
  "voltage-regulation": [
    ["voltage-regulation-1.jpg",900,675,"Inside an ATX power supply, with its parts lettered, from the mains input to the low-voltage outputs and their regulation.","Hans Haase","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Pc-psu_inner.JPG"],
    ["voltage-regulation-2.jpg",675,900,"A 7805 regulator on a circuit board: it holds its output at a steady 5 V.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Auerswald_COMfort_2000_Base_-_controller_-_7805-0250.jpg"]],
  "heatsink": [
    ["heatsink-1.jpg",900,900,"A CPU heatsink with its fan taken off: thin aluminium fins around a copper core give the heat a large surface to leave from.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Asus_P5PL2_-_CPU_heatsink-5298.jpg"],
    ["heatsink-2.jpg",900,600,"Heatsink fins, close up.","Niv Singer","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:CPU_Heatsink_closeup.jpg"]],
  "fan": [
    ["fan-1.jpg",900,720,"A 120 mm case fan, the usual size for moving air through a tower.","Eric Chan from Hong Kong","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:Corsair_Logo_120mm_desktop_computer_case_fan_(52504601012).jpg"],
    ["fan-2.jpg",900,900,"A smaller 80 mm case fan with a clear frame: the motor in the hub turns the blades.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:MS-TECH_Laitronic_Case_Cooler_80x80x25_mm-8530.jpg"]],
  "heat-pipes": [
    ["heat-pipes-1.jpg",853,900,"A tower CPU cooler: copper heat pipes rise from the base into the aluminium fins, with a fan on each side.","Eric Gaba (Sting)","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Noctua_NH-U12P_SE2_CPU_cooler.jpg"],
    ["cooling-3.jpg",900,893,"Heat pipes carry the heat from the CPU up into the fins.","Hannes Grobe","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:CPU-cooler-08_hg.jpg"]],
  "thermal-paste": [
    ["thermal-paste-1.jpg",675,900,"The base of a CPU cooler just after it was taken off: the grey thermal paste had filled the tiny gaps between cooler and chip.","Mattes","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:Computer_cooler_fan_underpart_with_thermal_grease,_detached.JPG"],
    ["thermal-paste-2.jpg",900,675,"Thermal paste in a syringe, with a small spatula to spread it.","FxJ","Public domain","","https://commons.wikimedia.org/wiki/File:Thermal_compound_pl.jpg"]],
  "usb": [
    ["usb-1.jpg",900,540,"USB ports on a front panel: the blue one is USB 3.0, the orange one only charges.","RoundupResistance","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:Orange_USB_port.jpg"],
    ["usb-2.jpg",900,675,"A USB Type-A port.","Aidan C. Siegel","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:USB_Connector.jpg"]],
  "video-out": [
    ["video-out-1.jpg",900,675,"The video outputs of a graphics card: three DisplayPort, one HDMI and one DVI.","Marc Mongenet","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Gigabyte_Radeon_RX_570_Gaming_4G,_external_side.jpg"]],
  "ethernet": [
    ["ethernet-1.jpg",900,600,"An Ethernet port next to USB ports. The network cable’s plug clicks into the square RJ45 socket.","Amit Saha","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Ethernet_And_Usb_Ports_(22902463).jpeg"]],
  "audio": [
    ["audio-1.jpg",900,632,"A sound card: its coloured 3.5 mm jacks are for speakers, microphone and line in, plus more speaker channels.","Evan-Amos","Public domain","","https://commons.wikimedia.org/wiki/File:Mad-Dog-Entertainer-Sound-Card.jpg"],
    ["audio-2.jpg",900,589,"A 3.5 mm audio plug. Green is the colour of a computer’s speaker or headphone output.","Evan-Amos","Public domain","","https://commons.wikimedia.org/wiki/File:Audio-TRS-Mini-Plug.jpg"]],
  "mic-capsule": [
    ["mic-capsule-1.jpg",900,587,"An electret microphone: the small capsule on the left, the whole microphone on the right.","Kae","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Electret_microphone_MKE3.JPG"],
    ["mic-3.jpg",900,692,"Electret microphone capsules, the kind inside most computer and headset microphones.","a Wikimedia Commons contributor","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:Electret_condenser_microphone_capsules.jpg"]],
  "mic-preamp": [
    ["mic-preamp-1.jpg",900,675,"The microphone preamplifier board of a 1970s tape recorder: its transistors boost the tiny voltage from the microphone.","tony_duell","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:Philips_N4450._Microphone_Input_PCB_(36192178501).jpg"]],
  "mic-adc": [
    ["mic-adc-1.jpg",831,900,"The silicon die of a Realtek audio codec, the chip on a motherboard that turns the microphone’s signal into numbers (and numbers back into sound).","cole8888","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:Realtek_ALC662_5.1_Channel_Audio_Codec_(100%25_Quality_PNG).png"]],
  "mic-usb": [
    ["mic-usb-1.jpg",675,900,"A USB microphone: its ADC and USB interface are built in, so it plugs straight into the computer.","Nicolas Rück (WMDE)","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Rode_NT-USB.jpg"]],
  "speaker-dac": [
    ["speaker-dac-1.jpg",900,675,"A DAC chip (Wolfson WM8759): it turns digital sound samples back into a voltage.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:TCM_237387_alarm_clock_with_MP3_player_-_board_1_-_Wolfson_WM8759GED-7471.jpg"]],
  "speaker-amp": [
    ["speaker-amp-1.jpg",900,506,"Two LM386 amplifier chips on a circuit board. Each boosts a weak sound signal enough to drive a small speaker.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Medion_MD_30008_-_board_-_LM386N-4248.jpg"]],
  "speaker-magnet": [
    ["speaker-magnet-1.jpg",900,675,"The magnet on the back of a speaker driver.","Jacques from Cape Town, South Africa","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:KEF_B110_-_magnet_(9280996921).jpg"],
    ["speaker-magnet-2.jpg",900,675,"A speaker turned over: the heavy round magnet sits behind the cone.","SATELIT BM","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Magnet_Loudspeaker.jpg"]],
  "speaker-coil": [
    ["speaker-coil-1.jpg",900,752,"The voice coil of a speaker: copper wire wound on a tube that moves in the magnet’s gap.","Corvintaurus","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Voice_coil_(Schwingspule)_of_a_Visaton_W_100_S_loudspeaker_(12_cm_diameter)_for_bass_and_midrange.jpg"],
    ["speaker-coil-2.jpg",900,672,"A bigger voice coil, 3 inches across, from a subwoofer.","Daniel Christensen","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Loudspeaker_voice_coil,_three_inch_diameter.jpg"],
    ["speaker-0.jpg",900,877,"The voice coil. Current through it pushes against the magnet and moves the cone.","Peter Hebels","Public domain","","https://commons.wikimedia.org/wiki/File:Voicecoil_of_large_speaker.jpg"]],
  "speaker-cone": [
    ["speaker-cone-1.jpg",900,675,"A speaker cone on its own, made of paper pulp: light and stiff, so it pushes the air without bending.","Speaker Cone Directory","Public domain","","https://commons.wikimedia.org/wiki/File:X5_Paper_Pulp_Cone.jpg"],
    ["speaker-cone-2.jpg",900,675,"The cone of a large speaker driver, from the front.","Jacques from Cape Town, South Africa","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:Altec_Lansing_515-8LF_-_Cone_(9253737045).jpg"]],
  "monitor-panel": [
    ["monitor-panel-1.jpg",900,600,"An LCD screen up close: every pixel is three subpixels, red, green and blue.","Politelyinsulting","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:LCD_subpixels.jpg"],
    ["monitor-panel-2.jpg",400,900,"Letters on an LCD, magnified: they are drawn with the red, green and blue subpixels.","ALexL33","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Subpixel_Rendering_LCD_photo_3is_composite.jpg"]],
  "monitor-backlight": [
    ["monitor-backlight-1.jpg",900,598,"An LCD panel’s backlight with the pixel layer taken off: rows of white LEDs shine through from behind.","RobertKuhlmann","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:LCD-Hintergrundbeleuchtung_mit_LEDs.JPG"],
    ["monitor-backlight-2.jpg",900,598,"An edge-lit backlight: the LEDs sit along one edge, and a light-guide plate spreads their light across the whole screen.","RobertKuhlmann","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:LCD-Hintergrundbeleuchtung_mit_Edge-LEDs.JPG"],
    ["monitor-in-6.jpg",900,498,"The backlight of an older monitor: lamps behind the panel that shine through the pixels.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:Chi_Mei_V315B1-L05_-_fluorescent_lamps_backlit-0380.jpg"]],
  "monitor-controller": [
    ["monitor-controller-1.jpg",900,623,"The controller board of an LCD monitor, with its video input connector.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Hyundai_HT15X13-200_-_controller_board_2-0125.jpg"],
    ["monitor-controller-2.jpg",900,900,"A monitor’s controller chip (Genesis gm2120): it reads the video signal, scales the picture to fit the panel and drives it.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Hercules_Prophetview_920_-_board_2_-_Genesis_gm2120-7987.jpg"]],
  "monitor-power": [
    ["monitor-power-1.jpg",900,675,"The power board of an LCD monitor: it turns mains power into the low voltages for the electronics and the backlight.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Dell_Professional_P2212H_-_power_supply_board-9911.jpg"]],
  "monitor-ports": [
    ["monitor-ports-1.jpg",900,598,"The video inputs on the back of a monitor: DVI and VGA.","Sinchen.Lin","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:ViewSonic_TD2220_ports_right.jpg"],
    ["monitor-ports-2.jpg",900,543,"The common video connectors: VGA, DVI and HDMI.","Evan-Amos, D-Kuru and others","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Connection_screen.jpg"]],
  "kb-keys": [
    ["kb-keys-1.jpg",900,720,"A mechanical key switch with its keycap off. The blue stem marks a “clicky” switch.","Fletcher","CC BY 4.0","https://creativecommons.org/licenses/by/4.0","https://commons.wikimedia.org/wiki/File:Outemu_Blue_Key_Switch.jpg"],
    ["kb-keys-2.jpg",900,675,"Key switches on a mechanical keyboard, lit from below.","ptm m","Public domain","","https://commons.wikimedia.org/wiki/File:MX_brown_key_switches.jpg"]],
  "kb-matrix": [
    ["kb-matrix-1.jpg",900,675,"A keyboard’s membrane: printed silver lines form the switch matrix, connected to a small circuit board.","Daniel beardsmore","Public domain","","https://commons.wikimedia.org/wiki/File:Dell_KB522_--_membrane_connected_to_hotkey_PCB.jpg"]],
  "kb-controller": [
    ["kb-controller-1.jpg",900,506,"A keyboard’s controller board. The chip is under the black blob (chip on board); it scans the matrix and sends key codes to the computer.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Cherry_Keyboard_G83-6105RLNDE_-_controller_board-8093.jpg"],
    ["kb-controller-2.jpg",900,442,"Another keyboard controller, also a bare chip under a drop of black resin.","Hans Haase","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Tastaturcontroller_COB_(Chip_On_Board)_IMG_8628.jpg"]],
  "mouse-sensor": [
    ["mouse-sensor-1.jpg",900,600,"The sensor, LED and lens of an optical mouse on its circuit board.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:HP_Mouse_M-U0031-O_-_printed_circuit_board-3259.jpg"],
    ["mouse-sensor-2.jpg",900,506,"The same board with the lens taken off: the square sensor chip in the middle is a tiny camera that takes pictures of the desk.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:HP_Mouse_M-U0031-O_-_printed_circuit_board_lens_removed-3255.jpg"],
    ["mouse-11.jpg",900,506,"The optical sensor chip and its lens, which watch the desk surface move.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:Logitech_M210_-_LED,_lens_and_optical_mouse_sensor-2426.jpg"]],
  "mouse-buttons": [
    ["mouse-buttons-1.jpg",900,675,"A microswitch, the part under each mouse button. Its spring gives the click you feel.","Daniel beardsmore","Public domain","","https://commons.wikimedia.org/wiki/File:Omron_microswitch.jpg"],
    ["mouse-buttons-2.jpg",900,675,"Inside a mouse: the microswitch sits right under the button.","Daniel beardsmore","Public domain","","https://commons.wikimedia.org/wiki/File:Apple_Desktop_Bus_Mouse_internals_showing_Omron_microswitch.jpg"]],
  "mouse-wheel": [
    ["mouse-wheel-1.jpg",900,675,"A mouse’s scroll wheel and the encoder that counts its steps as it turns.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Arcoxia_Mini_Optical_Mouse_-_scroll_wheel-2349.jpg"]],
  "mouse-controller": [
    ["mouse-controller-1.jpg",900,600,"The circuit board of a mouse, with its controller chip, which reads the movement and the buttons and reports them to the computer.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Microsoft_Serial_Mouse_2.0A_-_printed_circuit_board-8531.jpg"]],
  "joy-sensors": [
    ["joy-sensors-1.jpg",768,900,"A potentiometer: turning the shaft changes its resistance, and so the voltage the joystick’s controller reads.","Iainf","CC BY 2.5","https://creativecommons.org/licenses/by/2.5","https://commons.wikimedia.org/wiki/File:Potentiometer.jpg"],
    ["joystick-4.jpg",900,900,"An analogue stick: two potentiometers measure left–right and forward–back.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:PDP_Afterglow_PL-3702_for_Xbox_360_-_Joystick_potentiometer-8607.jpg"]],
  "joy-buttons": [
    ["joy-buttons-1.jpg",506,900,"Inside a simple joystick: the buttons press microswitches, and four more microswitches around the stick sense which way it is pushed.","Parrot of Doom","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Cruiser_joystick_internals.jpg"]],
  "pad-buttons": [
    ["gamepad-4.jpg",900,600,"A controller taken apart: the board, the rubber button pads and the case.","Multicherry","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:200_in_1_Famiclone_Retro_Mini_Controller_(disassembled_view_2).jpg"],
    ["gamepad-2.jpg",900,675,"Inside a game controller: the circuit board, its controller chip and the button contacts.","Eoin Houston","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:Gamecontrollerinternal.jpg"]],
  "pad-sticks": [
    ["joystick-4.jpg",900,900,"An analogue stick: two potentiometers measure left–right and forward–back.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:PDP_Afterglow_PL-3702_for_Xbox_360_-_Joystick_potentiometer-8607.jpg"]],
  "pad-rumble": [
    ["pad-rumble-1.jpg",900,559,"Rumble motors from a game controller: each spins an off-centre weight, which makes the controller shake.","Tiia Monto","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Vibration_motors.jpg"]],
  "pad-controller": [
    ["gamepad-2.jpg",900,675,"Inside a game controller: the circuit board, its controller chip and the button contacts.","Eoin Houston","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:Gamecontrollerinternal.jpg"]],
  "printer-cartridge": [
    ["printer-cartridge-1.jpg",900,785,"The print head of an inkjet printer: ink from the cartridges flows down to rows of tiny nozzles underneath.","Fletcher6","CC BY 3.0","https://creativecommons.org/licenses/by/3.0","https://commons.wikimedia.org/wiki/File:Canon_iP3500_Print_Head.jpg"],
    ["printer-cartridge-2.jpg",900,550,"An ink cartridge with the print head built in: the copper contacts carry the signals that fire each nozzle.","MarcoTangerino","Public domain","","https://commons.wikimedia.org/wiki/File:HP_Inkjet_Tri-color_Print_Cartridge_22.jpg"],
    ["printer-5.jpg",900,675,"Print heads and ink cartridges: cyan, magenta, yellow and black.","DMahalko","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:HP_Business_Inkjet_1200n_-_Continuous_Ink_System_-_Printhead_cover_open.jpg"]],
  "printer-carriage": [
    ["printer-carriage-1.jpg",900,675,"A printer’s carriage on its rail, pulled from side to side by a toothed belt.","tony_duell","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:Carriage_Belt_fitted.jpg"],
    ["printer-1.jpg",900,675,"Inside an inkjet printer: the carriage that carries the ink cartridges along its rail.","Klosito","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:Inkjet_printer_No_case,_front_side.JPG"]],
  "printer-rollers": [
    ["printer-rollers-1.jpg",900,675,"Paper feed rollers, seen from the back of a printer: rubber rollers grip the sheet and move it on, one line at a time.","Klosito","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Paper_feed_rollers_from_the_back_side.JPG"]],
  "printer-board": [
    ["printer-board-1.jpg",900,624,"An inkjet printer’s controller board, with the flat cables that go to the print head.","MarcoTangerino","Public domain","","https://commons.wikimedia.org/wiki/File:HP_Deskjet_D1560_Printer_Head_Control_Board_BL.jpg"]],
  "webcam-lens": [
    ["webcam-lens-1.jpg",900,900,"A tiny camera module from a phone, the same kind of part as in a webcam: the lens in its focusing mount.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Sony_Ericsson_W810i_-_camera_module-0351.jpg"],
    ["webcam-lens-2.jpg",900,900,"Another camera module’s lens, close up.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Samsung_SGH-F480V_-_Camera_module_-_rear_camera_-_lens-91875.jpg"]],
  "webcam-sensor": [
    ["webcam-sensor-1.jpg",900,898,"An image sensor chip from a digital camera: the rectangle in the middle is a grid of millions of light-sensitive pixels.","Glosome","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:S4000_Image_Sensor.jpg"],
    ["webcam-sensor-2.jpg",900,721,"An image sensor under a microscope: each pixel has a red, green or blue filter over it.","Gribkov","CC BY 4.0","https://creativecommons.org/licenses/by/4.0","https://commons.wikimedia.org/wiki/File:%D0%9F%D0%B8%D0%BA%D1%81%D0%B5%D0%BB%D0%B8_%D0%BC%D0%B0%D1%82%D1%80%D0%B8%D1%86%D1%8B_%D0%B2%D0%B8%D0%B4%D0%B5%D0%BE%D1%80%D0%B5%D0%B3%D0%B8%D1%81%D1%82%D1%80%D0%B0%D1%82%D0%BE%D1%80%D0%B0.jpg"]],
  "webcam-isp": [
    ["webcam-0.jpg",900,506,"Inside a webcam: the lens (right) and the image processor chip (left) on the camera board.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/","https://commons.wikimedia.org/wiki/File:Acer_TravelMate_P253-M-32344G50Maks_-_Webcam_module_-_Sunplus_SPCA2062B-0135.jpg"]],
  "dram-banks": [
    ["dram-2.jpg",900,611,"The die of a DRAM chip (Samsung, 64 megabits): its memory is split into four banks, the four large blocks.","Fritzchens Fritz","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:SAMSUNG@DDR-SDRAM@64MBit@K4D62323HA-QC60_Stack-DSC03539-DSC03556_-_ZS-DMap.jpg"],
    ["dram-banks-1.jpg",900,418,"The die of an older DRAM (the 64-kilobit U2164): memory arrays, with the decoders and sense amplifiers between them.","InfoSecDJ","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Zentrum-mikroelektronik-dresden_u2164c_infosecdj_mz_nikon20x.jpg"]],
  "nand-plane": [
    ["nand-plane-1.jpg",900,758,"The die of a 4 GB NAND flash chip: almost all of it is memory array, divided into large blocks (planes).","2x910","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:NAND_plan.jpg"]],
  "vram-chip": [
    ["vram-chip-1.jpg",900,675,"A GDDR5 memory chip on a graphics card (SK Hynix, 2 gigabits).","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Palit_GeForce_GTX_750_StormX_OC_-_SK_Hynix_H5GC2H24BFR-T2C-0219.jpg"],
    ["vram-chip-2.jpg",900,675,"A Samsung GDDR5 memory chip (8 gigabits).","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Mainboard_C5V01_LA-E892P_-_Samsung_K4G80325FB-HC28-5913.jpg"],
    ["vram-chip-3.jpg",900,626,"Inside a graphics memory chip: the silicon die of a Samsung GDDR3.","Fritzchens Fritz","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:SAMSUNG@QDDR3-SDRAM@256MBit@K5J55323QF-GC16_Stack-DSC01340-DSC01367_-_ZS-retouched.jpg"]],
  "vram-hbm": [
    ["vram-hbm-1.jpg",900,603,"A GPU package with HBM: the large GPU die in the middle and four memory stacks beside it, all on one silicon interposer.","C. Spille/pcgameshardware.de","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:AMD_Fiji_GPU_package_with_GPU,_HBM_memory_and_interposer.jpg"],
    ["vram-hbm-2.jpg",900,570,"The die of an HBM memory chip, one layer of a stack.","FritzchensFritz","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:AMD@14nm@GCN_5th_gen@Vega10@Radeon_RX_Vega_64@HBM_DRAM_Die@_Stack-DSC08838-DSC08973_-_ZS-retouched.jpg"]],
  "gpu-pcie": [
    ["gpu-pcie-1.jpg",900,177,"The PCIe x16 connector of a graphics card: the gold contacts that plug into the motherboard’s slot.","D-Kuru","CC BY-SA 3.0 AT","https://creativecommons.org/licenses/by-sa/3.0/at/deed.en","https://commons.wikimedia.org/wiki/File:Sapphire_Radeon_HD_5870_%E2%80%93_PCIe_x16_connection_PNr%C2%B00314.jpg"]],
  "gpu-power": [
    ["gpu-power-1.jpg",900,598,"Power delivery on a graphics card: chokes and transistors turn the 12 V supply into the low voltage the GPU runs on.","Nick Stathas","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Power_Delivery_on_a_Graphics_Card.jpg"],
    ["gpu-power-2.jpg",675,900,"An 8-pin PCIe power connector on a graphics card, for extra power straight from the power supply.","Biggo Finance","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Intel_Arc_Pro_B70_-_side_view_with_8-pin_power_connector.jpg"]],
  "disp-ports": [
    ["display-outputs-1.jpg",900,600,"The outputs of a graphics card: DisplayPort, HDMI and DVI connectors on its metal bracket.","MiNe","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:EVGA_02G-P4-2966-KR_outputs_20150129.jpg"],
    ["monitor-ports-2.jpg",900,543,"The connectors at the end of the cable: VGA, DVI and HDMI.","Evan-Amos, D-Kuru and others","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Connection_screen.jpg"]],
  "clock": [
    ["clock-1.jpg",900,580,"Quartz crystals. One like these sets the steady beat that the clock circuits multiply up to the CPU’s speed.","Kae","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Crystal_oscillator_RU.jpg"],
    ["clock-2.jpg",900,840,"Inside a crystal oscillator: the quartz crystal and the small circuit that keeps it vibrating.","Marcin Andrzejewski","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:Crystal_oscillator_internals.JPG"]],
  "cache": [
    ["cpu-6.jpg",900,675,"A map of a real processor die: four cores, shared cache, graphics and the memory controller.","Intel in Deutschland","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0/","https://commons.wikimedia.org/wiki/File:4th_Generation_Intel%C2%AE_Core%E2%84%A2_Processor_Die_Map.jpg"],
    ["cache-1.jpg",900,543,"The die of a mobile Pentium II. The large, regular blocks on the left are its on-chip L2 cache: memory shows up as rows of identical cells.","Martijn Boer","Public domain","","https://commons.wikimedia.org/wiki/File:Intel-pentium-ii-dixon-die-shot-high-resolution-stitched.jpg"]],
  "i8086": [
    ["i8086-1.jpg",900,877,"The silicon die of an 8086 (made by Siemens): about 29,000 transistors.","Pauli Rautakorpi","CC BY 3.0","https://creativecommons.org/licenses/by/3.0","https://commons.wikimedia.org/wiki/File:Siemens_SAB_8086_die.JPG"],
    ["i8086-2.jpg",900,600,"An Intel 8086 in its ceramic 40-pin package (the 5 MHz version).","Thomas Nguyen","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Intel_C8086.jpg"]],
  "registers": [
    ["registers-1.jpg",900,675,"A register as a chip: the 74LS273 holds 8 bits in eight D flip-flops.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Animation_Technologies_LifeView_LR25_-_Hitachi_LS273-2523.jpg"]],
  "decoder": [
    ["decoder-1.jpg",900,473,"A 74LS138 decoder chip: a 3-bit code selects one of 8 outputs, the basic job of any decoder.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:SN74LS138N_2.jpg"]],
  "bus-interface": [
    ["bus-interface-1.jpg",900,391,"A 74LS245 bus transceiver: it connects 8 lines to a bus in either direction, or lets go of the bus.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:SN74LS245N_1.jpg"]],
  "alu": [
    ["alu-1.jpg",900,594,"A whole 4-bit ALU on one chip: the 74LS181, with 16 logic and 16 arithmetic operations.","Drahtlos","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Fairchild_F74LS181PC.jpg"],
    ["alu-2.jpg",900,898,"The silicon die of a 74181 ALU (the CMOS version, 74HC181).","Mikhail Svarichevsky","CC BY 3.0","https://creativecommons.org/licenses/by/3.0","https://commons.wikimedia.org/wiki/File:Toshiba-TC74HC181P-HD.jpg"]],
  "multiplexer": [
    ["multiplexer-1.jpg",900,473,"A 74LS157: four 2-to-1 multiplexers in one chip.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:SN74LS157N.jpg"],
    ["multiplexer-2.jpg",900,506,"A 74LS151 8-to-1 multiplexer on a 1980s graphics card.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:ATI_EGA_Wonder_800%2B_-_Texas_Instruments_SN74LS151N-0028.jpg"]],
  "d-flip-flop": [
    ["d-flip-flop-1.jpg",900,478,"A 7474 (Motorola SN74LS74A): two D flip-flops in one chip.","Erwin138 at Hebrew Wikipedia","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:7474_flip_flop.JPG"]],
  "and-gate": [
    ["and-gate-1.jpg",900,458,"The AND gate as a real part: a 74LS08 chip holds four of them.","Drahtlos","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Signetics_74LS08.jpg"],
    ["and-gate-2.jpg",897,900,"The silicon die inside a 74LS08, with its bond pads around the edge. Its circuits make four AND gates.","Robert.Baruch","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74LS08_TI_8022_die_120nmpp.jpg"]],
  "or-gate": [
    ["or-gate-1.jpg",900,506,"The OR gate as a real part: a 74LS32 chip holds four of them (here on the main board of a Commodore Amiga 1000).","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Commodore_Amiga_1000_-_main_board_-_Panasonic_74LS32-7429.jpg"]],
  "not-gate": [
    ["not-gate-1.jpg",900,506,"The NOT gate as a real part: a 74LS04 chip holds six of them, so it is called a hex inverter.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Commodore_Amiga_1000_-_main_board_-_Panasonic_74LS04-7428.jpg"]],
  "nand-gate": [
    ["nand-gate-1.jpg",900,468,"The NAND gate as a real part: a 7400 chip holds four of them.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:7400_9N00.jpg"],
    ["nand-gate-2.jpg",829,900,"The die of a 7400, with its pads labelled by pin (A1, B1, Y1 …). Its circuits make four NAND gates.","Maximumspatium","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:7400_NS_443_die_annotated.jpg"]],
  "nor-gate": [
    ["nor-gate-1.jpg",900,468,"The NOR gate as a real part: a 7402 chip holds four of them.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:7402_9N02.jpg"]],
  "xor-gate": [
    ["xor-gate-1.jpg",900,787,"The XOR gate as a real part: a 74LS86 chip holds four of them.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74LS86.jpg"]],
  "ic-8086": [
    ["i8086-2.jpg",900,600,"An Intel 8086 in its ceramic package (the 5 MHz version).","Thomas Nguyen","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Intel_C8086.jpg"],
    ["ic-8086-1.jpg",900,460,"An Intel D8086 (the D is for its ceramic package).","Konstantin Lanzet","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/","https://commons.wikimedia.org/wiki/File:KL_Intel_D8086.jpg"],
    ["i8086-1.jpg",900,877,"The 8086’s silicon die (this one made by Siemens): about 29,000 transistors.","Pauli Rautakorpi","CC BY 3.0","https://creativecommons.org/licenses/by/3.0","https://commons.wikimedia.org/wiki/File:Siemens_SAB_8086_die.JPG"]],
  "ic-8088": [
    ["ic-8088-1.jpg",900,412,"An Intel 8088 in a plastic 40-pin package. Inside it is an 8086 with an 8-bit external data bus.","Kunszabo","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Intel_8088_nMOS_microprocessor_in_plastic_DIP40_package.jpg"],
    ["ic-8088-2.jpg",900,600,"The main board of the original IBM PC (1984 version), which ran on an 8088.","Oligopolism","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:Ibm5150mobo1984black.jpg"]],
  "ic-z80": [
    ["ic-z80-1.jpg",900,506,"A Zilog Z80 (the CMOS Z84C00) in its socket on a circuit board.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Basic_Measuring_Instruments_-_Math_Processor_83002190_-_Zilog_Z80-3916.jpg"]],
  "ic-6502": [
    ["ic-6502-1.jpg",900,565,"A MOS 6502, the low-cost 8-bit processor behind the Apple II and many home computers of its time.","Christian Bassow","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:MOS_6502_1.jpg"],
    ["ic-6502-2.jpg",809,900,"The 6502’s silicon die: about 3,500 transistors.","Pauli Rautakorpi","CC BY 3.0","https://creativecommons.org/licenses/by/3.0","https://commons.wikimedia.org/wiki/File:MOS_6502_die.jpg"]],
  "ic-6116": [
    ["sram-1.jpg",900,541,"A 6116 static RAM chip (Hyundai HY6116, 2 KB).","Satyamfifa","Public domain","","https://commons.wikimedia.org/wiki/File:Hyundai_RAM_HY6116AP-10.jpg"]],
  "ic-4164": [
    ["ic-4164-1.jpg",721,900,"A TMS4164 64-kilobit DRAM in a ceramic package.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:TMS4164-15JDL.jpg"],
    ["dram-banks-1.jpg",900,418,"The die of a 4164-type DRAM (the East German U2164): memory arrays, with the decoders and sense amplifiers between them.","InfoSecDJ","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Zentrum-mikroelektronik-dresden_u2164c_infosecdj_mz_nikon20x.jpg"]],
  "ic-27c256": [
    ["ic-27c256-1.jpg",900,603,"27C256 EPROMs (ST M27C256). The quartz window lets ultraviolet light in to erase them.","yellowcloud from Germany","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:256kbit_EPROM_ST_Microelectronics_M27C256_(1).jpg"],
    ["ic-27c256-2.jpg",900,599,"An AMD 27C256 close up: the memory die shows through its window.","Anonimski","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:EPROM_AM27C256DC.jpg"]],
  "ic-w25q128": [
    ["bios-2.jpg",900,900,"A Winbond 25Q16 serial flash chip: the same family as the W25Q128, with 16 instead of 128 megabits.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:H-L_Data_Storage_GT60N_-_board_-_Winbond_25Q16CVSIG-9332.jpg"]],
  "ic-24c02": [
    ["spd-1.jpg",900,900,"A 24C02 EEPROM (STMicroelectronics) in its small 8-pin package on a printer’s board.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Hewlett-Packard_DeskJet_710C_-_controller_board_-_STMicroelectronis_24C02-7811.jpg"],
    ["ic-24c02-1.jpg",900,629,"The silicon die inside a 24C02.","Cole L","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:ST_24C02_Die_Shot_(Serial_EEPROM)_(52871939743).png"]],
  "ic-555": [
    ["ic-555-1.jpg",900,718,"Two NE555 timers: the classic DIP package and the small surface-mount (SOIC) one.","Swift.Hg","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:NE555_DIP_%26_SOIC.jpg"]],
  "ic-7805": [
    ["voltage-regulation-2.jpg",675,900,"A 7805 regulator on a circuit board: input, ground and a steady 5 V output.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Auerswald_COMfort_2000_Base_-_controller_-_7805-0250.jpg"]],
  "ic-lm317": [
    ["ic-lm317-1.jpg",600,900,"An LM317 adjustable regulator in its TO-220 package. The metal tab is for a heatsink.","Retired electrician","CC0","https://creativecommons.org/publicdomain/zero/1.0/","https://commons.wikimedia.org/wiki/File:LM317_(OnSemi)_01.jpg"],
    ["ic-lm317-2.jpg",832,900,"An LM317 bolted to a heatsink, which carries away the heat it makes.","Gelpgim22","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Regulador_LM317_en_disipador.JPG"]],
  "ic-lm386": [
    ["ic-lm386-1.jpg",900,675,"An LM386 audio amplifier chip on a circuit board.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Micro-electric_T3000_-_board_-_National_Semiconductor_LM386N-0694.jpg"],
    ["speaker-amp-1.jpg",900,506,"Two LM386 amplifiers on one board.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Medion_MD_30008_-_board_-_LM386N-4248.jpg"]],
  "ic-max232": [
    ["ic-max232-1.jpg",900,675,"A MAX232: it converts between the serial port’s ±12 V signals and 5 V logic.","Travis Goodspeed","CC BY 2.0","https://creativecommons.org/licenses/by/2.0","https://commons.wikimedia.org/wiki/File:MAX232_Chip.jpg"],
    ["ic-max232-2.jpg",900,675,"Small RS-232 to logic-level converter boards, each built around a MAX232.","Dsimic","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:RS-232_to_TTL_converters_using_MAX232.jpg"]],
  "ic-7408": [
    ["and-gate-1.jpg",900,458,"A 74LS08 on a circuit board.","Drahtlos","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Signetics_74LS08.jpg"],
    ["and-gate-2.jpg",897,900,"The 74LS08’s silicon die, with its bond pads around the edge. Its circuits make four AND gates.","Robert.Baruch","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74LS08_TI_8022_die_120nmpp.jpg"]],
  "ic-7432": [
    ["or-gate-1.jpg",900,506,"A 74LS32 on the main board of a Commodore Amiga 1000.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Commodore_Amiga_1000_-_main_board_-_Panasonic_74LS32-7429.jpg"],
    ["ic-7432-1.jpg",900,759,"A 74LS32 on its own (made in Romania, 1990).","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74LS32.jpg"]],
  "ic-7404": [
    ["not-gate-1.jpg",900,506,"A 74LS04 on the main board of a Commodore Amiga 1000.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Commodore_Amiga_1000_-_main_board_-_Panasonic_74LS04-7428.jpg"],
    ["ic-7404-1.jpg",900,757,"A 74LS04 (made in Romania in the 1980s).","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74LS04.jpg"]],
  "ic-7400": [
    ["nand-gate-1.jpg",900,468,"A 7400 (Fairchild 9N00), the first chip of the 7400 family.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:7400_9N00.jpg"],
    ["nand-gate-2.jpg",829,900,"The 7400’s silicon die, with its pads labelled by pin (A1, B1, Y1 …).","Maximumspatium","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:7400_NS_443_die_annotated.jpg"]],
  "ic-7402": [
    ["nor-gate-1.jpg",900,468,"A 7402 (Fairchild 9N02).","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:7402_9N02.jpg"],
    ["ic-7402-1.jpg",900,460,"The same four NOR gates in a newer, faster family: the 74ALS02.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:SN74ALS02N.jpg"]],
  "ic-7486": [
    ["xor-gate-1.jpg",900,787,"A 74LS86 (made in Romania, 1991).","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74LS86.jpg"],
    ["ic-7486-1.jpg",900,899,"The die of a 74HC86, the CMOS version: four XOR gate circuits.","Cole L","CC BY-SA 2.0","https://creativecommons.org/licenses/by-sa/2.0","https://commons.wikimedia.org/wiki/File:TI_HC86_QUAD_2-INPUT_XOR_GATES_(50592736716).png"]],
  "ic-74157": [
    ["multiplexer-1.jpg",900,473,"A Texas Instruments SN74LS157.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:SN74LS157N.jpg"]],
  "ic-7474": [
    ["d-flip-flop-1.jpg",900,478,"A Motorola SN74LS74A.","Erwin138 at Hebrew Wikipedia","CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0","https://commons.wikimedia.org/wiki/File:7474_flip_flop.JPG"],
    ["ic-7474-1.jpg",900,787,"A 74LS74 (made in Romania, 1990).","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74LS74.jpg"]],
  "ic-74161": [
    ["ic-74161-1.jpg",900,690,"A 74HCT161 counter in a small surface-mount package: the CMOS version of the 74LS161.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:74HCT161D.jpg"],
    ["ic-74161-2.jpg",900,731,"The silicon die of a 74HCT161 counter.","Mikhail Svarichevsky","CC BY 3.0","https://creativecommons.org/licenses/by/3.0","https://commons.wikimedia.org/wiki/File:RCA-CD54HCT161F-HD.jpg"]],
  "ic-74138": [
    ["decoder-1.jpg",900,473,"A Texas Instruments SN74LS138.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:SN74LS138N_2.jpg"],
    ["ic-74138-1.jpg",900,445,"A Hitachi HD74LS138.","Drahtlos","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Hitachi_HD74LS138P.jpg"]],
  "ic-74245": [
    ["bus-interface-1.jpg",900,391,"A Texas Instruments SN74LS245.","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:SN74LS245N_1.jpg"]],
  "ic-74373": [
    ["ic-74373-1.jpg",900,506,"A 74LS373 latch on the main board of a Commodore Amiga 1000.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Commodore_Amiga_1000_-_main_board_-_Panasonic_74LS373-9007.jpg"]],
  "ic-74273": [
    ["registers-1.jpg",900,675,"A Hitachi 74LS273 on an expansion card.","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Animation_Technologies_LifeView_LR25_-_Hitachi_LS273-2523.jpg"]],
  "ic-74181": [
    ["alu-1.jpg",900,594,"A Fairchild 74LS181.","Drahtlos","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:Fairchild_F74LS181PC.jpg"],
    ["alu-2.jpg",900,898,"The silicon die of a 74HC181, the CMOS version.","Mikhail Svarichevsky","CC BY 3.0","https://creativecommons.org/licenses/by/3.0","https://commons.wikimedia.org/wiki/File:Toshiba-TC74HC181P-HD.jpg"]],
  "ic-74151": [
    ["multiplexer-2.jpg",900,506,"A Texas Instruments SN74LS151 on an ATI EGA graphics card (1980s).","Raimond Spekking","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:ATI_EGA_Wonder_800%2B_-_Texas_Instruments_SN74LS151N-0028.jpg"],
    ["ic-74151-1.jpg",900,688,"A 74151-type multiplexer (CDB4151, made in Romania).","Mister rf","CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0","https://commons.wikimedia.org/wiki/File:CDB4151EM.jpg"]],
};
