import sys
try:
    from PIL import Image
    def remove_white(in_path, out_path, tol=230):
        img = Image.open(in_path).convert("RGBA")
        datas = img.getdata()
        newData = []
        for item in datas:
            if item[0] >= tol and item[1] >= tol and item[2] >= tol:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        img.save(out_path, "PNG")
    remove_white(sys.argv[1], sys.argv[2])
    print("Success")
except ImportError:
    print("Pillow not installed")
except Exception as e:
    print(f"Error: {e}")
