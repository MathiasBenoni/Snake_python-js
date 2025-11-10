import pygame
import js

pygame.init()
screen = pygame.display.set_mode((600, 400))
clock = pygame.time.Clock()

msg_from_js = ""

def from_js(msg):
    global msg_from_js
    print("Mottatt fra JS:", msg)
    # legg til eventuell spill-logikk her
js.python = from_js

x, y = 200, 200

running = True
while running:
    for e in pygame.event.get():
        if e.type == pygame.QUIT:
            running = False

    screen.fill((50, 50, 100))
    pygame.draw.circle(screen, (255, 0, 0), (x, y), 30)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()