using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services;

namespace YoutubeDownloader.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly SettingsService _settingsService;

        public SettingsController(SettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public ActionResult<AppSettingsModel> GetSettings()
        {
            return Ok(_settingsService.GetSettings());
        }

        [HttpPut]
        public ActionResult<AppSettingsModel> SaveSettings([FromBody] AppSettingsModel settings)
        {
            _settingsService.SaveSettings(settings);
            return Ok(_settingsService.GetSettings());
        }
    }
}
