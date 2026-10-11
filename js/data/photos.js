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
};
