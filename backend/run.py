from app import create_app, db

app = create_app()

with app.app_context():
    db.create_all()

'''
if __name__ == '__main__':
    app.run(debug=True)
'''
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)


    # Verificar rutas cargadas
    print("RUTAS REGISTRADAS:")
    for rule in app.url_map.iter_rules():
        print(rule)