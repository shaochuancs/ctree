var ontJson = {
        "children" : [
                  {
                      "name" : "Anode3",
                      "id"  : "Anode3_id",
                      "children" : [
                          {
                              "name" : "SubnodeA",
                              "type" : "is_a"
                          }, {
                              "id" : "Tomcatzzzzccccc",
                              "children" : [
                                  {"name" : "XXXX"},{"name" : "ZZZZ"}
                              ]
                          },{
                              "name" : "Jerrymouse",
                              "id"  : "jerrymouseID",
                              "type" : "is_a"
                          },{
							  name : "LastT",
							  children : ["rererere","rerefdfd"]
						  }
                      ]
                  },
                  {
                      "name" : "Bnode2",
				  	  "children" : [{"name":"BBBBB"},{"name":"MMMM"}]
                  }      
              ]
          };
var lifeTree = {
				"name" : "Life",
                "children" : [
                          "plant", {
                              "name" : "Animal",
                              "children" : [
                                  {"name" : "Cataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},{"name" : "Dog"}
                              ]
                          },"Bacteria"
                      ]
          };
var hardwareJson = {
            "children" : [
                {
                    "name" : "Internal Hardware",
                    "children" : [
                        {
                        "name" : "Hard Disk",
                        "type" : "hardDisk"
                        },{
                        "name" : "CPU",
                        "type" : "cpu",
                        "children" : [
                            {
                            "name" : "CPU Fan",
                            "type" : "cpuFan"
                            }
                        ]
                        },{
                        "name" : "Battery",
                        "type" : "battery"
                        }
                    ]
                },{
                    "name" : "External Hardware",
                    "children" : [
                    {
                    "name" : "Microphone",
                    "type" : "microPhone",
                    "children" : [
                        "Audio Input Line",
                        "erm"
                    ]
                    },{
                    "name" : "Gaming",
                    "type" : "gaming"
                    }
                    ]
                }
            ]
}
$(function(){
    $(".treeClass").ctree({
    	"json_data" : lifeTree,
        "types" : {
            "hardDisk" : {"icon" : "imgFiles/drive-harddisk-3.png"},
            "cpu" : {"icon" : "imgFiles/cpu.png"},
            "battery" : {"icon" : "imgFiles/battery-2.png"},
            "microPhone" : {"icon" : "imgFiles/audio-input-microphone-2.png"},
            "gaming" : {"icon" : "imgFiles/input-gaming-2.png"},
            "cpuFan" : {"icon" : "imgFiles/cpu-fan.png"},
            "audioInputLine" : {"icon" : "imgFiles/audio-input-line.png"}
        }
        //"select_mode" : true
    });
    var f = function(e, obj){
        var x = 'tmp';
    };
    $("#ontTree").ctree({
        "json_data" : ontJson,
        "types" : {
            "hardDisk" : {"icon" : "imgFiles/drive-harddisk-3.png"},
            "cpu" : {"icon" : "imgFiles/cpu.png"},
            "battery" : {"icon" : "imgFiles/battery-2.png"},
            "microPhone" : {"icon" : "imgFiles/audio-input-microphone-2.png"},
            "gaming" : {"icon" : "imgFiles/input-gaming-2.png"},
            "cpuFan" : {"icon" : "imgFiles/cpu-fan.png"},
            "audioInputLine" : {"icon" : "imgFiles/audio-input-line.png"}
        },
        "select_mode" : true,
        "cTreeImgs" : "src/cTreeNodeIcons.png"
        //"forceUseImgs" : true
        //"noCancelSelect_mode" : true,
    }).bind('CTREE_EVENT_DESELECT', function(e, obj){alert(obj)}).bind('CTREE_EVENT_SELECT', f);
});